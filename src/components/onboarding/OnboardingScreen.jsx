import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CloudUpload, LogIn } from "lucide-react";
import { C, CARD_STYLE, FONT_HEADING, PROVIDERS, API_KEY_LINKS, GOOGLE_OAUTH_CLIENT_LINK } from "../../data/constants";
import { normalizeApiSettings, normalizePracticeSettings, formatModelLabel, isTokenValid } from "../../utils/helpers";
import { makeFadeUp, makeTap } from "../shared";

export default function OnboardingScreen({
  lang, apiSettings, setApiSettings, practiceSettings, setPracticeSettings,
  authState, setAuthState, onComplete, startGoogleSignIn, syncNow, syncStatus,
}) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const provider = apiSettings.providerId;

  const onGoogleSignIn = async () => { setLoading(true); await startGoogleSignIn(); setLoading(false); };
  const onSync = async () => { setLoading(true); await syncNow(); setLoading(false); };

  return (
    <motion.div {...makeFadeUp(reduceMotion)} style={{ minHeight: "100vh", padding: "20px 14px", display: "flex", alignItems: "center" }}>
      <div style={{ ...CARD_STYLE, borderRadius: 22, padding: 18, width: "100%", maxWidth: 740, margin: "0 auto" }}>
        <h2 style={{ color: C.text, marginBottom: 6, fontFamily: FONT_HEADING, letterSpacing: -0.2 }}>{lang === "te" ? "స్వాగతం" : "Welcome to Jessy Speech Coach"}</h2>
        <p style={{ color: C.textLight, fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
          {lang === "te" ? "మొదటి సెటప్ పూర్తిచేయండి. అన్ని డేటా స్థానికంగా సేవ్ అవుతుంది, గూగుల్ డ్రైవ్ సింక్ ఐచ్చికం." : "Complete first-time setup. Data is local-first; Google Drive sync is optional."}
        </p>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[0, 1, 2].map((s) => <div key={s} style={{ flex: 1, height: 6, borderRadius: 99, background: s <= step ? C.primary : "rgba(255,255,255,.1)" }} />)}
        </div>

        {step === 0 && (
          <div style={{ marginBottom: 14, color: C.textLight, fontSize: 14, lineHeight: 1.6 }}>
            <p>
              <strong style={{ color: C.text }}>{lang === "te" ? "ప్రైవసీ నోట్:" : "Privacy note:"}</strong>{" "}
              {lang === "te" ? "API keys మరియు ప్రాక్టీస్ డేటా మీ బ్రౌజర్‌లోనే నిల్వ అవుతుంది. మీరు సైన్ ఇన్ చేస్తే మాత్రమే డ్రైవ్‌లో బ్యాకప్ అవుతుంది." : "API keys and practice data stay in your browser. Drive backup is used only when you sign in."}
            </p>
            <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "లెవెల్-1 పదాల లక్ష్యం" : "Level-1 item target"}</span>
              <select value={practiceSettings.level1Target} onChange={(e) => setPracticeSettings((prev) => normalizePracticeSettings({ ...prev, level1Target: Number(e.target.value) }))} style={{ borderRadius: 10, padding: "10px 12px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }}>
                {[50, 75, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "స్పీచ్ + AAC మోడ్" : "Speech + AAC mode"}</span>
              <select value={practiceSettings.communicationMode} onChange={(e) => setPracticeSettings((prev) => normalizePracticeSettings({ ...prev, communicationMode: e.target.value }))} style={{ borderRadius: 10, padding: "10px 12px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }}>
                <option value="speech-only">{lang === "te" ? "స్పీచ్ మాత్రమే" : "Speech only"}</option>
                <option value="aac-speech">{lang === "te" ? "AAC + స్పీచ్ కలిపి" : "AAC + speech together"}</option>
                <option value="aac-first">{lang === "te" ? "ముందు AAC, తర్వాత స్పీచ్" : "AAC first, then speech"}</option>
              </select>
            </label>
          </div>
        )}

        {step === 1 && (
          <div style={{ marginBottom: 14 }}>
            <div className="responsive-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "AI ప్రొవైడర్" : "AI provider"}</span>
                <select value={provider} onChange={(e) => setApiSettings((prev) => normalizeApiSettings({ ...prev, providerId: e.target.value }))} style={{ borderRadius: 10, padding: "10px 12px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }}>
                  {Object.values(PROVIDERS).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "మోడల్" : "Model"}</span>
                <select value={apiSettings.modelByProvider[provider] || ""} onChange={(e) => setApiSettings((prev) => normalizeApiSettings({ ...prev, modelByProvider: { ...prev.modelByProvider, [provider]: e.target.value } }))} disabled={provider === "offline"} style={{ borderRadius: 10, padding: "10px 12px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }}>
                  {(PROVIDERS[provider]?.models || []).map((m) => <option key={m} value={m}>{formatModelLabel(provider, m, lang)}</option>)}
                </select>
              </label>
            </div>
            {provider === "groq" && <div style={{ fontSize: 12, color: C.textLight, marginBottom: 8 }}>{lang === "te" ? "auto తో Groq పని ప్రకారం బెస్ట్ మోడల్ ఆటోగా ఎంచుకుంటుంది." : "Groq auto mode selects the best model for the task."}</div>}
            {provider !== "offline" && (
              <>
                <label style={{ display: "grid", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "API కీ" : "API key"}</span>
                  <input type="password" value={apiSettings.apiKeys[provider] || ""} onChange={(e) => setApiSettings((prev) => ({ ...prev, apiKeys: { ...prev.apiKeys, [provider]: e.target.value } }))} placeholder={lang === "te" ? "API కీ" : "API key"} autoComplete="off" style={{ width: "100%", borderRadius: 10, padding: "10px 12px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text }} />
                </label>
                <a href={API_KEY_LINKS[provider]} target="_blank" rel="noreferrer" style={{ marginTop: 8, display: "inline-block", color: C.secondary, fontSize: 12, textDecoration: "underline" }}>{lang === "te" ? "API కీ పొందు" : "Get API key"}</a>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: C.textLight }}>Google OAuth Client ID</span>
              <input value={authState.googleClientId || ""} onChange={(e) => setAuthState((prev) => ({ ...prev, googleClientId: e.target.value }))} placeholder="Google OAuth Client ID" autoComplete="off" style={{ width: "100%", borderRadius: 10, padding: "10px 12px", background: C.cardStrong, border: `1px solid ${C.border}`, color: C.text, marginBottom: 8 }} />
            </label>
            <a href={GOOGLE_OAUTH_CLIENT_LINK} target="_blank" rel="noreferrer" style={{ marginBottom: 8, display: "inline-block", color: C.secondary, fontSize: 12, textDecoration: "underline" }}>{lang === "te" ? "Google OAuth Client ID సృష్టించు" : "Create Google OAuth Client ID"}</a>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <motion.button onClick={onGoogleSignIn} {...makeTap(reduceMotion)} disabled={loading} style={{ border: "none", borderRadius: 10, padding: "10px 12px", background: C.primaryLight, color: C.text, fontWeight: 700, display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}><LogIn size={15} /> {lang === "te" ? "గూగుల్ సైన్ ఇన్" : "Sign in with Google"}</motion.button>
              <motion.button onClick={onSync} {...makeTap(reduceMotion)} disabled={loading || !isTokenValid(authState)} style={{ border: "none", borderRadius: 10, padding: "10px 12px", background: C.secondaryLight, color: C.text, fontWeight: 700, display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}><CloudUpload size={15} /> {lang === "te" ? "ఇప్పుడు సింక్" : "Sync now"}</motion.button>
            </div>
            <p style={{ color: syncStatus?.kind === "error" ? C.danger : C.textLight, fontSize: 12, marginTop: 8 }}>{syncStatus?.message || ""}</p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <motion.button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} {...makeTap(reduceMotion)} style={{ border: `1px solid ${C.border}`, background: "transparent", color: C.text, padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
            {lang === "te" ? "వెనక్కి" : "Back"}
          </motion.button>
          {step < 2 ? (
            <motion.button onClick={() => setStep((s) => s + 1)} {...makeTap(reduceMotion)} style={{ border: "none", background: C.primary, color: "white", padding: "10px 14px", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {lang === "te" ? "తర్వాత" : "Next"} <ArrowRight size={15} />
            </motion.button>
          ) : (
            <motion.button onClick={onComplete} {...makeTap(reduceMotion)} style={{ border: "none", background: C.success, color: "#032821", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}>
              {lang === "te" ? "ప్రారంభించు" : "Start App"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
