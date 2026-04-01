import { GOOGLE_SCOPES, JESSY_SPEECH_ANALYSIS_PROMPT, PROVIDERS } from "../data/constants";
import {
  normalizeModelSelection,
  getGroqCandidateModels,
  isModelSelectionError,
} from "./helpers";

// ─── Google Identity ─────────────────────────────────────

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  const existing = document.getElementById("google-identity-services");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export async function fetchGoogleProfile(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("profile_fetch_failed");
  const profile = await response.json();
  return {
    id: profile.sub,
    name: profile.name || profile.email || "Google User",
    email: profile.email || "",
    picture: profile.picture || "",
  };
}

export async function requestGoogleAccessToken({ clientId, prompt = "consent" }) {
  await loadGoogleIdentityScript();
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: (response) => {
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response);
      },
    });
    tokenClient.requestAccessToken({ prompt });
  });
}

// ─── LLM completion ──────────────────────────────────────

export function normalizeAssistantText(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => (typeof c === "string" ? c : c?.text || "")).join(" ").trim();
  }
  return "";
}

export async function requestProviderCompletion({ settings, messages, signal, maxTokens = 450, intent = "chat" }) {
  const provider = PROVIDERS[settings.providerId];
  if (!provider || settings.providerId === "offline") {
    throw new Error("offline_mode");
  }
  const apiKey = settings.apiKeys?.[settings.providerId];
  if (!apiKey) {
    throw new Error("missing_key");
  }

  const selectedModel = normalizeModelSelection(settings.providerId, settings.modelByProvider?.[settings.providerId]);
  const candidateModels = settings.providerId === "groq"
    ? getGroqCandidateModels(selectedModel, intent)
    : [selectedModel || provider.models[0]];
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (settings.providerId === "openrouter") {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "Jessy Speech Coach";
  }

  let lastError = null;
  for (let i = 0; i < candidateModels.length; i += 1) {
    const model = candidateModels[i];
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: settings.temperature ?? 0.4,
      }),
      signal,
    });

    if (!response.ok) {
      const text = await response.text();
      const err = new Error(text || "provider_error");
      err.code = response.status;
      lastError = err;
      const canRetryAnotherModel = settings.providerId === "groq"
        && selectedModel === "auto"
        && i < candidateModels.length - 1
        && isModelSelectionError(response.status, text);
      if (canRetryAnotherModel) continue;
      throw err;
    }

    const payload = await response.json();
    const text = normalizeAssistantText(payload);
    if (text) return text;
    lastError = new Error("empty_response");
  }

  throw lastError || new Error("provider_error");
}

// ─── Groq STT ────────────────────────────────────────────

export async function transcribeWithGroq({ audioBlob, groqApiKey, language = "auto", signal, model = "auto" }) {
  if (!groqApiKey) throw new Error("missing_groq_key");
  const ext = audioBlob.type.includes("webm") ? "webm" : "wav";
  const sttModels = model === "auto"
    ? ["whisper-large-v3-turbo", "whisper-large-v3"]
    : [model];
  let lastError = null;
  for (let i = 0; i < sttModels.length; i += 1) {
    const formData = new FormData();
    formData.append("file", new File([audioBlob], `jessy-sample.${ext}`, { type: audioBlob.type || "audio/webm" }));
    formData.append("model", sttModels[i]);
    if (language === "te" || language === "en") formData.append("language", language);
    formData.append("response_format", "verbose_json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: formData,
      signal,
    });
    if (!response.ok) {
      const text = await response.text();
      const err = new Error(text || "stt_failed");
      err.code = response.status;
      lastError = err;
      const canRetry = model === "auto" && i < sttModels.length - 1 && isModelSelectionError(response.status, text);
      if (canRetry) continue;
      throw err;
    }
    const data = await response.json();
    return {
      text: data.text || "",
      confidence: data.language || "unknown",
    };
  }
  throw lastError || new Error("stt_failed");
}

// ─── Analysis JSON parse ─────────────────────────────────

export function parseAnalysisJson(text, lang) {
  try {
    const parsed = JSON.parse(text);
    return {
      attempted: parsed.attempted || "",
      likelyPattern: parsed.likelyPattern || "",
      modelNext: parsed.modelNext || "",
      caregiverScript: parsed.caregiverScript || "",
      confidence: parsed.confidence || "medium",
      raw: text,
    };
  } catch {
    return {
      attempted: lang === "te" ? "ఉచ్చారణ ప్రయత్నం గుర్తించబడింది." : "Utterance attempt captured.",
      likelyPattern: text || (lang === "te" ? "ప్యాటర్న్ స్పష్టంగా లేదు." : "Pattern unclear."),
      modelNext: lang === "te" ? "2 భాగాల్లో నెమ్మదిగా చెప్పి కలిసి పునరావృతం చేయండి." : "Model slowly in 2 parts and repeat together.",
      caregiverScript: lang === "te" ? "చాలా బాగా ప్రయత్నించావు, మనం కలిసి మళ్లీ చెప్తాం." : "Great try, let's say it together again.",
      confidence: "low",
      raw: text,
    };
  }
}

// ─── Google Drive backup ─────────────────────────────────

export async function findDriveBackupFile(accessToken) {
  const query = encodeURIComponent("name='jessy_speech_backup.json' and trashed=false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder&fields=files(id,name,modifiedTime)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("drive_list_failed");
  const data = await response.json();
  return data.files?.[0] || null;
}

export async function uploadBackupToDrive({ accessToken, backupFileId, payload }) {
  const metadata = backupFileId
    ? { name: "jessy_speech_backup.json" }
    : { name: "jessy_speech_backup.json", parents: ["appDataFolder"] };
  const boundary = "jessy_boundary_123";
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    `${JSON.stringify(payload)}\r\n` +
    `--${boundary}--`;

  const method = backupFileId ? "PATCH" : "POST";
  const endpoint = backupFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${backupFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) throw new Error("drive_upload_failed");
  return response.json();
}

export async function restoreBackupFromDrive(accessToken, fileId) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("drive_restore_failed");
  return response.json();
}

// ─── Offline fallbacks ───────────────────────────────────

export function offlineTip(word, lang, idx = 0) {
  const templatesEn = [
    `Say "${word.word}" slowly in 2 beats and let Jessy watch your mouth. Then clap once for each syllable and celebrate any attempt.`,
    `Model "${word.word}" three times with a warm tone, then pause and wait 5 seconds. If she says even part of it, praise her and repeat.`,
    `Use "${word.word}" during play and pair it with pointing. Keep it fun with a tiny reward like high-five or favorite toy turn.`,
  ];
  const templatesTe = [
    `"${word.word}" పదాన్ని 2 భాగాలుగా నెమ్మదిగా చెప్పండి. జెస్సీ నోటి కదలికలు చూడనివ్వండి, ప్రతి అక్షరానికి ఒక చప్పటి కొట్టండి.`,
    `"${word.word}" పదాన్ని మీరు 3 సార్లు చూపించి చెప్పండి, తర్వాత 5 సెకన్లు వేచి ఉండండి. ఆమె కొంచెం అయినా అంటే వెంటనే ప్రశంసించండి.`,
    `ఆటలో "${word.word}" పదాన్ని చూపిస్తూ సహజంగా చెప్పండి. చిన్న హై-ఫైవ్ లేదా ఆట టర్న్‌తో సరదాగా ప్రాక్టీస్ చేయండి.`,
  ];
  const bank = lang === "te" ? templatesTe : templatesEn;
  return bank[idx % bank.length];
}

export function offlineChat(text, lang) {
  const q = text.toLowerCase();
  const replyEn = q.includes("frustrat") || q.includes("cry")
    ? "Pause and co-regulate first: hold her hands, breathe together for 10 seconds, then model one easy word like 'amma'. Praise effort, not perfect speech. Try again only after she feels calm."
    : q.includes("meal") || q.includes("food")
    ? "At meal time, keep language simple: model one target word before each bite, like 'water' or 'more'. Wait 5 seconds before helping. If she gestures, convert that gesture into the spoken model and repeat warmly."
    : "Pick one easy word, say it slowly with clear mouth movement, and pair it with action. Use 3 short rounds of 2 minutes instead of one long session. Celebrate every attempt with immediate praise.";
  const replyTe = q.includes("ఏడుస్తుంది") || q.includes("నిరాశ")
    ? "మొదట ఆమెను శాంతింపజేయండి: చేతులు పట్టుకుని 10 సెకన్లు నెమ్మదిగా శ్వాస తీసుకోండి. తర్వాత 'అమ్మ' లాంటి సులభ పదం మాత్రమే చూపించండి. పర్ఫెక్ట్ మాటకంటే ప్రయత్నాన్ని ప్రశంసించండి."
    : q.includes("భోజన")
    ? "భోజన సమయంలో ఒక్కో బైట్ ముందు ఒక చిన్న పదం మాత్రమే మోడల్ చేయండి, ఉదా: 'నీళ్ళు' లేదా 'ఇంకా'. 5 సెకన్లు వేచి ఉండండి. ఆమె సంకేతం ఇస్తే ఆ సంకేతాన్ని పదంగా మార్చి మెల్లిగా మళ్ళీ చెప్పండి."
    : "ఒక సులభ పదం ఎంచుకుని నోటి కదలిక స్పష్టంగా చూపుతూ నెమ్మదిగా చెప్పండి. ఒకేసారి ఎక్కువ కాకుండా 2 నిమిషాల 3 చిన్న రౌండ్లు చేయండి. ఆమె ప్రతి ప్రయత్నాన్ని వెంటనే ప్రశంసించండి.";
  return lang === "te" ? replyTe : replyEn;
}
