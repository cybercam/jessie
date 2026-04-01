import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Bot, CheckCheck, CheckCircle2, ChevronDown, ChevronUp,
  Cloud, CloudDownload, CloudUpload, AlertTriangle, LogIn, LogOut,
  Mic, Settings2, WifiOff, X,
} from "lucide-react";
import { C, CARD_STYLE, FONT_BODY, PROVIDERS, API_KEY_LINKS, GOOGLE_OAUTH_CLIENT_LINK, JESSY_SPEECH_ANALYSIS_PROMPT } from "../../data/constants";
import {
  normalizeApiSettings, formatModelLabel, getProviderDefaultModel, isTokenValid,
} from "../../utils/helpers";
import { requestProviderCompletion, transcribeWithGroq, parseAnalysisJson } from "../../utils/api";
import { measureChatText, clearChatLayoutCache } from "../chat/pretextChatLayout";
import { makeFadeUp, makeTap } from "../shared";

export default function AiChatTab({
  lang, apiSettings, setApiSettings, apiStatus, setApiStatus,
  requestCoachReply, authState, syncPrefs, setSyncPrefs,
  syncNow, restoreFromDrive, startGoogleSignIn, signOutGoogle, setAuthState,
  analysisHistory, setAnalysisHistory,
}) {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [testingApi, setTestingApi] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [analysisLanguage, setAnalysisLanguage] = useState("auto");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisTranscript, setAnalysisTranscript] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [spokenEnabled, setSpokenEnabled] = useState(true);
  const [chatViewportWidth, setChatViewportWidth] = useState(360);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const messageSeqRef = useRef(1);
  // Pretext layout cache keyed by message ID + viewport width
  const layoutCacheRef = useRef(new Map());

  const quickQuestions = lang === 'te' ? [
    "జెస్సీ 'అమ్మ' అని చెప్పడానికి ప్రయత్నిస్తుంది కానీ 'అ-మ-మ-అ' అని చెబుతుంది. ఏం చేయాలి?",
    "ఆమె నిరాశ చెంది ఏడుస్తుంది. నేను ఏం చేయాలి?",
    "భోజన సమయంలో మాట అభ్యాసం ఎలా చేయాలి?",
  ] : [
    "Jessy tries to say 'amma' but says 'a-m-m-a'. What should I do?",
    "She gets frustrated and cries. How should I handle it?",
    "How can I practice speech during meal times?",
  ];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;
    const update = () => setChatViewportWidth(Math.max(220, node.clientWidth || 360));
    update();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => update());
      ro.observe(node);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => () => clearChatLayoutCache(), []);

  // Invalidate layout cache when viewport width changes
  useEffect(() => { layoutCacheRef.current.clear(); }, [chatViewportWidth]);

  // Pretext-cached measurement — only measures on first encounter per message+width
  const measuredMessages = useMemo(() => {
    const cache = layoutCacheRef.current;
    const bubbleMaxWidth = Math.max(180, Math.floor(chatViewportWidth * 0.85));
    const maxTextWidth = Math.max(100, bubbleMaxWidth - 32);
    const opts = { font: "600 14px Manrope", lineHeight: 22, maxTextWidth, paddingY: 12 };
    return messages.map((m) => {
      const cacheKey = `${m.id}_${maxTextWidth}`;
      if (!cache.has(cacheKey)) {
        cache.set(cacheKey, measureChatText(m.content, opts));
      }
      return { ...m, _layout: cache.get(cacheKey) };
    });
  }, [messages, chatViewportWidth]);

  const buildMessage = (role, content) => ({
    id: `${Date.now()}_${messageSeqRef.current++}`,
    role,
    content,
  });

  const updateProvider = (providerId) => {
    setApiSettings((prev) => {
      const next = { ...prev, providerId };
      if (!next.modelByProvider?.[providerId]) {
        next.modelByProvider = { ...next.modelByProvider, [providerId]: getProviderDefaultModel(providerId) };
      }
      return normalizeApiSettings(next);
    });
    setApiStatus((prev) => ({ ...prev, kind: providerId === "offline" ? "offline" : "idle", message: "" }));
  };
  const updateKey = (providerId, value) => setApiSettings((prev) => ({ ...prev, apiKeys: { ...prev.apiKeys, [providerId]: value } }));
  const updateModel = (providerId, value) => setApiSettings((prev) => normalizeApiSettings({ ...prev, modelByProvider: { ...prev.modelByProvider, [providerId]: value } }));

  const testConnection = async () => {
    if (apiSettings.providerId === "offline") { setApiStatus({ kind: "offline", message: lang === "te" ? "ఆఫ్లైన్ మోడ్ యాక్టివ్" : "Offline mode active" }); return; }
    setTestingApi(true);
    const ctrl = new AbortController();
    try {
      await requestProviderCompletion({ settings: apiSettings, messages: [{ role: "system", content: "Reply with exactly: ok" }, { role: "user", content: "ping" }], signal: ctrl.signal, maxTokens: 10 });
      setApiStatus({ kind: "connected", message: lang === "te" ? "కనెక్షన్ సక్సెస్" : "Connection successful" });
    } catch (err) {
      const code = err?.code;
      const base = code === 401 ? "Invalid API key" : code === 429 ? "Rate limit reached" : "Connection failed";
      setApiStatus({ kind: "error", message: `${base}${code ? ` (${code})` : ""}` });
    } finally { setTestingApi(false); }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = buildMessage("user", text);
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setLoading(true);
    abortRef.current = new AbortController();
    try {
      const reply = await requestCoachReply({ text, lang, signal: abortRef.current.signal, history: newMsgs });
      setMessages([...newMsgs, buildMessage("assistant", reply || (lang === "te" ? "స్పందన రాలేదు. మళ్లీ ప్రయత్నించండి." : "No response received. Please try again."))]);
    } catch {
      setApiStatus({ kind: "error", message: lang === "te" ? "AI స్పందన విఫలమైంది" : "AI response failed" });
      setMessages([...newMsgs, buildMessage("assistant", lang === "te" ? "క్లౌడ్ స్పందన రాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి." : "Cloud response failed. Please try again.")]);
    } finally { setLoading(false); abortRef.current = null; }
  };

  const cancelRequest = () => { abortRef.current?.abort(); setLoading(false); };

  const speakCoach = (text) => {
    if (!spokenEnabled || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "te" ? "te-IN" : "en-US"; u.rate = 0.92; u.pitch = 1.02;
    window.speechSynthesis.speak(u);
  };

  const startAnalysisRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data?.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => { audioBlobRef.current = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }); };
      recorder.start(); mediaRecorderRef.current = recorder; setRecording(true);
    } catch { setApiStatus({ kind: "error", message: lang === "te" ? "మైక్ అనుమతి ఇవ్వండి." : "Please allow microphone access." }); }
  };

  const stopAnalysisRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null; setRecording(false);
  };

  const transcribeRecording = async () => {
    if (!audioBlobRef.current) return;
    const groqApiKey = apiSettings.apiKeys?.groq || "";
    if (!groqApiKey) { setApiStatus({ kind: "error", message: lang === "te" ? "Groq API key అవసరం." : "Groq API key required for speech analysis." }); return; }
    setTranscribing(true);
    try {
      const output = await transcribeWithGroq({ audioBlob: audioBlobRef.current, groqApiKey, language: analysisLanguage, model: "auto" });
      setAnalysisTranscript(output.text || "");
      setApiStatus({ kind: "connected", message: lang === "te" ? "ట్రాన్స్‌క్రిప్ట్ సిద్ధం." : "Transcript ready." });
    } catch (err) { setApiStatus({ kind: "error", message: err?.code ? `STT failed (${err.code})` : "STT failed" }); }
    finally { setTranscribing(false); }
  };

  const runSpeechAnalysis = async () => {
    const transcript = analysisTranscript.trim();
    if (!transcript) return;
    setAnalyzing(true);
    try {
      let settings = apiSettings;
      if (settings.providerId === "offline" && apiSettings.apiKeys?.groq) settings = { ...apiSettings, providerId: "groq" };
      const userPrompt = lang === "te"
        ? `జెస్సీ పలికిన వాక్యం: "${transcript}". మోటార్ ప్లానింగ్ దృష్టితో సంక్షిప్త విశ్లేషణ ఇవ్వండి.`
        : `Jessy utterance: "${transcript}". Provide concise motor-planning focused analysis.`;
      const text = await requestProviderCompletion({ settings, messages: [{ role: "system", content: JESSY_SPEECH_ANALYSIS_PROMPT }, { role: "user", content: userPrompt }], intent: "analysis", maxTokens: 360 });
      const parsed = parseAnalysisJson(text, lang);
      setAnalysisResult(parsed);
      setAnalysisHistory((prev) => [{ ts: new Date().toISOString(), language: analysisLanguage, transcript, ...parsed }, ...prev].slice(0, 10));
      speakCoach(`${parsed.likelyPattern}. ${parsed.modelNext}`);
    } catch {
      setAnalysisResult(parseAnalysisJson("", lang));
      setApiStatus({ kind: "error", message: lang === "te" ? "విశ్లేషణ విఫలమైంది." : "Analysis failed." });
    } finally { setAnalyzing(false); }
  };

  const handleSyncNow = async () => { setSyncBusy(true); await syncNow(); setSyncBusy(false); };
  const handleRestore = async () => { setSyncBusy(true); await restoreFromDrive(); setSyncBusy(false); };

  return (
    <motion.div {...makeFadeUp(reduceMotion)} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ ...CARD_STYLE, background: C.purpleLight, borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 13, lineHeight: 1.5, color: C.text }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Bot size={15} />
          {lang === 'te' ? 'జెస్సీ స్పీచ్ గురించి కోచ్ అసిస్టెంట్‌ని ఏదైనా అడగండి' : 'Ask the coach assistant about Jessy\'s speech'}
        </span>
      </div>

      {/* API Settings */}
      <div style={{ ...CARD_STYLE, borderRadius: 14, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSettings ? 12 : 0 }}>
          <strong style={{ color: C.text, display: "inline-flex", alignItems: "center", gap: 6 }}><Settings2 size={14} /> API Settings</strong>
          <motion.button aria-label={showSettings ? "Collapse" : "Expand"} {...makeTap(reduceMotion)} onClick={() => setShowSettings(!showSettings)} style={{ background: "transparent", border: "none", color: C.text, cursor: "pointer", minHeight: 40, minWidth: 40 }}>
            {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </motion.button>
        </div>
        {showSettings && (
          <>
            <div className="responsive-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "AI ప్రొవైడర్" : "AI provider"}</span>
                <select value={apiSettings.providerId} onChange={(e) => updateProvider(e.target.value)} style={{ borderRadius: 10, padding: "8px 10px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }}>
                  {Object.values(PROVIDERS).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "మోడల్" : "Model"}</span>
                <select value={apiSettings.modelByProvider[apiSettings.providerId] || ""} onChange={(e) => updateModel(apiSettings.providerId, e.target.value)} disabled={apiSettings.providerId === "offline"} style={{ borderRadius: 10, padding: "8px 10px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }}>
                  {(PROVIDERS[apiSettings.providerId]?.models || []).map((m) => <option key={m} value={m}>{formatModelLabel(apiSettings.providerId, m, lang)}</option>)}
                </select>
              </label>
            </div>
            {apiSettings.providerId === "groq" && (
              <div style={{ fontSize: 12, color: C.textLight, marginBottom: 8 }}>{lang === "te" ? "auto ఎంపికతో పని ఆధారంగా Groq బెస్ట్ మోడల్ ఆటోగా ఎంపిక అవుతుంది." : "With auto, Groq picks the best available model based on task type."}</div>
            )}
            {apiSettings.providerId !== "offline" && (
              <>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "API కీ" : "API key"}</span>
                  <input type="password" value={apiSettings.apiKeys[apiSettings.providerId] || ""} onChange={(e) => updateKey(apiSettings.providerId, e.target.value)} placeholder={lang === "te" ? "API Key పేస్ట్ చేయండి" : "Paste API key"} autoComplete="off" style={{ width: "100%", borderRadius: 10, padding: "10px 12px", marginBottom: 8, background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }} />
                </label>
                <a href={API_KEY_LINKS[apiSettings.providerId]} target="_blank" rel="noreferrer" style={{ marginBottom: 8, display: "inline-block", color: C.secondary, fontSize: 12, textDecoration: "underline" }}>{lang === "te" ? "API కీ పొందు" : "Get API key"}</a>
              </>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <motion.button onClick={testConnection} {...makeTap(reduceMotion)} disabled={testingApi} style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: C.primaryLight, color: C.text, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckCheck size={14} /> {testingApi ? "Testing..." : "Test API"}
              </motion.button>
              <span style={{ fontSize: 12, color: apiStatus.kind === "error" ? C.danger : C.textLight, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {apiStatus.kind === "error" ? <AlertTriangle size={13} /> : apiStatus.kind === "offline" ? <WifiOff size={13} /> : <CheckCircle2 size={13} />}
                {apiStatus.message || (apiStatus.kind === "offline" ? "Offline fallback active" : "Idle")}
              </span>
            </div>
            {/* Google Drive sync section */}
            <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
              <div className="responsive-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <label style={{ display: "grid", gap: 6, gridColumn: "1 / span 2" }}>
                  <span style={{ fontSize: 12, color: C.textLight }}>Google OAuth Client ID</span>
                  <input value={authState.googleClientId || ""} onChange={(e) => setAuthState((prev) => ({ ...prev, googleClientId: e.target.value }))} placeholder="Google OAuth Client ID" autoComplete="off" style={{ borderRadius: 10, padding: "8px 10px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }} />
                </label>
                <a href={GOOGLE_OAUTH_CLIENT_LINK} target="_blank" rel="noreferrer" style={{ gridColumn: "1 / span 2", color: C.secondary, fontSize: 12, textDecoration: "underline" }}>{lang === "te" ? "Google OAuth Client ID సృష్టించు" : "Create Google OAuth Client ID"}</a>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {!isTokenValid(authState) ? (
                  <motion.button onClick={startGoogleSignIn} {...makeTap(reduceMotion)} style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: C.primaryLight, color: C.text, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><LogIn size={14} /> Google Sign-In</motion.button>
                ) : (
                  <motion.button onClick={signOutGoogle} {...makeTap(reduceMotion)} style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: "rgba(255,255,255,0.06)", color: C.text, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><LogOut size={14} /> Sign out</motion.button>
                )}
                <motion.button onClick={handleSyncNow} disabled={syncBusy || !isTokenValid(authState)} {...makeTap(reduceMotion)} style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: C.secondaryLight, color: C.text, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><CloudUpload size={14} /> Sync now</motion.button>
                <motion.button onClick={handleRestore} disabled={syncBusy || !isTokenValid(authState)} {...makeTap(reduceMotion)} style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: C.accentLight, color: C.text, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><CloudDownload size={14} /> Restore</motion.button>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textLight }}>
                  <input type="checkbox" checked={syncPrefs.autoSync} onChange={(e) => setSyncPrefs((prev) => ({ ...prev, autoSync: e.target.checked }))} /> Auto-sync
                </label>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.textLight, display: "inline-flex", alignItems: "center", gap: 6 }}><Cloud size={13} />{syncPrefs.lastSyncStatus || "Not synced yet"}</div>
            </div>
          </>
        )}
      </div>

      {/* Speech Analysis */}
      <div style={{ ...CARD_STYLE, borderRadius: 14, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong style={{ color: C.text, display: "inline-flex", alignItems: "center", gap: 6 }}><Mic size={14} /> Jessy Speech Analysis</strong>
          <label style={{ fontSize: 12, color: C.textLight, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={spokenEnabled} onChange={(e) => setSpokenEnabled(e.target.checked)} /> {lang === "te" ? "వాయిస్ స్పందన" : "Voice reply"}
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <select value={analysisLanguage} onChange={(e) => setAnalysisLanguage(e.target.value)} style={{ borderRadius: 10, padding: "8px 10px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }}>
            <option value="auto">{lang === "te" ? "భాష: ఆటో" : "Language: Auto"}</option>
            <option value="te">{lang === "te" ? "తెలుగు" : "Telugu"}</option>
            <option value="en">{lang === "te" ? "ఇంగ్లీష్" : "English"}</option>
          </select>
          {!recording ? (
            <motion.button onClick={startAnalysisRecording} {...makeTap(reduceMotion)} style={{ minHeight: 44, border: "none", borderRadius: 10, padding: "8px 12px", background: C.primaryLight, color: C.text, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Mic size={14} /> {lang === "te" ? "రికార్డ్" : "Record"}</motion.button>
          ) : (
            <motion.button onClick={stopAnalysisRecording} {...makeTap(reduceMotion)} style={{ minHeight: 44, border: "none", borderRadius: 10, padding: "8px 12px", background: "rgba(255,255,255,0.08)", color: C.text, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><X size={14} /> {lang === "te" ? "స్టాప్" : "Stop"}</motion.button>
          )}
          <motion.button onClick={transcribeRecording} disabled={transcribing || !audioBlobRef.current} {...makeTap(reduceMotion)} style={{ minHeight: 44, border: "none", borderRadius: 10, padding: "8px 12px", background: C.secondaryLight, color: C.text, fontWeight: 700, cursor: "pointer" }}>
            {transcribing ? (lang === "te" ? "ట్రాన్స్‌క్రైబ్..." : "Transcribing...") : (lang === "te" ? "ట్రాన్స్‌క్రైబ్" : "Transcribe")}
          </motion.button>
          <motion.button onClick={runSpeechAnalysis} disabled={analyzing || !analysisTranscript.trim()} {...makeTap(reduceMotion)} style={{ minHeight: 44, border: "none", borderRadius: 10, padding: "8px 12px", background: C.accentLight, color: C.text, fontWeight: 700, cursor: "pointer" }}>
            {analyzing ? (lang === "te" ? "విశ్లేషణ..." : "Analyzing...") : "Analyze"}
          </motion.button>
        </div>
        <textarea value={analysisTranscript} onChange={(e) => setAnalysisTranscript(e.target.value)} placeholder={lang === "te" ? "ట్రాన్స్‌క్రిప్ట్ ఇక్కడ కనిపిస్తుంది (ఎడిట్ చేయవచ్చు)" : "Transcript appears here (editable)"} style={{ width: "100%", minHeight: 72, borderRadius: 10, padding: "10px 12px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text, resize: "vertical" }} />
        {analysisResult && (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {[
              [lang === "te" ? "ఆమె ప్రయత్నం" : "What she attempted", analysisResult.attempted],
              [lang === "te" ? "సాధ్యమైన ప్యాటర్న్" : "Likely pattern", analysisResult.likelyPattern],
              [lang === "te" ? "ఇప్పుడు మోడల్ చేయండి" : "What to model next", analysisResult.modelNext],
              [lang === "te" ? "కేర్‌గివర్ స్క్రిప్ట్" : "Caregiver script", analysisResult.caregiverScript],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                <strong style={{ color: C.text }}>{label}</strong>
                <div style={{ color: C.textLight, marginTop: 4 }}>{value}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.textLight }}>{lang === "te" ? "గమనిక: ఇది మద్దతు కోసం మాత్రమే, వైద్య నిర్ధారణ కాదు." : "Note: supportive coaching only, not a medical diagnosis."}</div>
          </div>
        )}
        {analysisHistory?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: C.textLight, marginBottom: 6 }}>{lang === "te" ? "ఇటీవలి విశ్లేషణలు" : "Recent analyses"}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {analysisHistory.slice(0, 3).map((item, i) => (
                <div key={`${item.ts}-${i}`} style={{ padding: 8, borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ color: C.text, fontSize: 12 }}>{new Date(item.ts).toLocaleString()}</div>
                  <div style={{ color: C.textLight, fontSize: 12, marginTop: 2 }}>{item.transcript}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick questions */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {quickQuestions.map((q, i) => (
          <motion.button key={i} onClick={() => sendMessage(q)} {...makeTap(reduceMotion)} style={{
            padding: "6px 12px", borderRadius: 12, border: `1px solid ${C.purple}30`,
            background: "rgba(255,255,255,0.03)", fontSize: 12, color: C.purple, cursor: "pointer",
            fontWeight: 500, textAlign: "left",
          }}>
            {q.length > 50 ? q.slice(0, 50) + "..." : q}
          </motion.button>
        ))}
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} style={{ minHeight: 180, maxHeight: "min(46vh, 420px)", overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: C.textLight, fontSize: 14 }}>
            {lang === 'te' ? 'మీ ప్రశ్న అడగండి లేదా పై బటన్‌లు నొక్కండి' : 'Ask your question or tap the buttons above'}
          </div>
        )}
        <AnimatePresence>
          {measuredMessages.map((m, i) => (
            <motion.div key={m.id || i}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.22 }}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%", padding: "12px 16px", borderRadius: 16,
                minHeight: `${Math.max(46, Math.ceil(m?._layout?.minHeight || 46))}px`,
                background: m.role === "user" ? C.primary : C.cardStrong,
                color: m.role === "user" ? "white" : C.text,
                fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                overflowWrap: m?._layout?.useAggressiveWrap ? "anywhere" : "break-word",
                wordBreak: m?._layout?.useAggressiveWrap ? "break-word" : "normal",
                boxShadow: m.role === "assistant" ? "0 8px 20px rgba(5,10,25,.35)" : "none",
                border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
              }}
            >
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "12px 20px", borderRadius: 16, background: C.cardStrong, border: `1px solid ${C.border}` }}>
            <Bot size={20} color={C.textLight} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          aria-label={lang === "te" ? "AI ప్రశ్న" : "AI question"}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage(input)}
          placeholder={lang === 'te' ? 'మీ ప్రశ్న టైప్ చేయండి...' : 'Type your question...'}
          style={{ flex: 1, padding: "14px 18px", borderRadius: 14, border: `2px solid ${C.border}`, fontSize: 16, outline: "none", fontFamily: FONT_BODY, background: C.cardStrong, color: C.text }}
        />
        <motion.button aria-label="Send" onClick={() => !loading && sendMessage(input)} disabled={loading} {...makeTap(reduceMotion)} style={{
          padding: "14px 20px", borderRadius: 14, border: "none", background: C.primary, color: "white",
          fontWeight: 800, fontSize: 16, cursor: "pointer", opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center",
        }}><ArrowRight size={18} /></motion.button>
        {loading && (
          <motion.button aria-label="Cancel" onClick={cancelRequest} {...makeTap(reduceMotion)} style={{
            padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer",
          }}><X size={16} /></motion.button>
        )}
      </div>
    </motion.div>
  );
}
