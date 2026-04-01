import React, { useState, useEffect, Suspense, lazy } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Sparkles, Languages, Settings2, ListChecks, Repeat2, Mic,
  Music2, Users, Gamepad2, CheckCheck, Bot,
} from "lucide-react";
import {
  C, FONT_BODY, FONT_HEADING, CARD_STYLE,
  DEFAULT_API_SETTINGS, DEFAULT_AUTH_STATE, DEFAULT_SYNC_PREFS,
  DEFAULT_PRACTICE_SETTINGS, DEFAULT_SESSION_METRICS, LS_KEYS,
} from "./src/data/constants";
import { CORE_WORDS_EXPANDED } from "./src/data/words";
import {
  loadJson, saveJson, todayKey, startOfWeekKey,
  normalizeSessionMetrics, normalizeApiSettings, normalizePracticeSettings,
  defaultDailyMetrics, isTokenValid,
} from "./src/utils/helpers";
import {
  requestGoogleAccessToken, fetchGoogleProfile,
  requestProviderCompletion, findDriveBackupFile,
  uploadBackupToDrive, restoreBackupFromDrive,
  offlineTip, offlineChat,
} from "./src/utils/api";
import { makeFadeUp, makeTap } from "./src/components/shared";
import OnboardingScreen from "./src/components/onboarding/OnboardingScreen";

// ─── Lazy-loaded tabs ────────────────────────────────────
const RoutineTab = lazy(() => import("./src/components/tabs/RoutineTab"));
const ImitationTab = lazy(() => import("./src/components/tabs/ImitationTab"));
const WordPracticeTab = lazy(() => import("./src/components/tabs/WordPracticeTab"));
const SongTab = lazy(() => import("./src/components/tabs/SongTab"));
const JointAttentionTab = lazy(() => import("./src/components/tabs/JointAttentionTab"));
const SpeechGamesTab = lazy(() => import("./src/components/tabs/SpeechGamesTab"));
const DashboardTab = lazy(() => import("./src/components/tabs/DashboardTab"));
const CaregiverFeedbackTab = lazy(() => import("./src/components/tabs/CaregiverFeedbackTab"));
const AiChatTab = lazy(() => import("./src/components/tabs/AiChatTab"));
const SyllablePopTab = lazy(() => import("./SyllablePopTab"));

const TabLoader = () => (
  <div style={{ display: "grid", placeItems: "center", minHeight: 120, color: C.textLight, fontSize: 13 }}>
    Loading…
  </div>
);

// ─── MAIN APP ────────────────────────────────────────────
export default function JessySpeechApp() {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState("routine");
  const [lang, setLang] = useState("en");
  const [completedSections, setCompletedSections] = useState(new Set());
  const [wordStats, setWordStats] = useState(() => ({ day: todayKey(), practicedToday: [], difficultWords: [], totalRatings: 0 }));
  const [sessionMetrics, setSessionMetrics] = useState(() => normalizeSessionMetrics(DEFAULT_SESSION_METRICS));
  const [apiSettings, setApiSettings] = useState(DEFAULT_API_SETTINGS);
  const [apiStatus, setApiStatus] = useState({ kind: "offline", message: "Offline fallback active" });
  const [authState, setAuthState] = useState(DEFAULT_AUTH_STATE);
  const [syncPrefs, setSyncPrefs] = useState(DEFAULT_SYNC_PREFS);
  const [practiceSettings, setPracticeSettings] = useState(DEFAULT_PRACTICE_SETTINGS);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // ─── localStorage load ──────────────────────────────────
  useEffect(() => {
    const loaded = loadJson(LS_KEYS.wordStats, null);
    if (loaded && typeof loaded === "object") {
      setWordStats(loaded.day === todayKey() ? loaded : { day: todayKey(), practicedToday: [], difficultWords: loaded.difficultWords || [], totalRatings: loaded.totalRatings || 0 });
    }
    const loadedApi = loadJson(LS_KEYS.apiSettings, null);
    if (loadedApi && typeof loadedApi === "object") {
      const normalized = normalizeApiSettings(loadedApi);
      setApiSettings(normalized);
      setApiStatus({ kind: (normalized.providerId || "offline") === "offline" ? "offline" : "idle", message: "" });
    }
    const loadedAuth = loadJson(LS_KEYS.authState, null);
    if (loadedAuth && typeof loadedAuth === "object") setAuthState((prev) => ({ ...prev, ...loadedAuth }));
    const loadedSyncPrefs = loadJson(LS_KEYS.syncPrefs, null);
    if (loadedSyncPrefs && typeof loadedSyncPrefs === "object") setSyncPrefs((prev) => ({ ...prev, ...loadedSyncPrefs }));
    const loadedPractice = loadJson(LS_KEYS.practiceSettings, null);
    if (loadedPractice && typeof loadedPractice === "object") setPracticeSettings(normalizePracticeSettings(loadedPractice));
    const loadedMetrics = loadJson(LS_KEYS.sessionMetrics, null);
    if (loadedMetrics && typeof loadedMetrics === "object") setSessionMetrics(normalizeSessionMetrics(loadedMetrics));
    const loadedOnboarding = loadJson(LS_KEYS.onboarding, null);
    if (loadedOnboarding?.completed) setOnboardingDone(true);
    const loadedAnalysisHistory = loadJson(LS_KEYS.analysisHistory, null);
    if (Array.isArray(loadedAnalysisHistory)) setAnalysisHistory(loadedAnalysisHistory);
  }, []);

  // ─── localStorage persist ───────────────────────────────
  useEffect(() => { saveJson(LS_KEYS.wordStats, wordStats); }, [wordStats]);
  useEffect(() => { saveJson(LS_KEYS.sessionMetrics, sessionMetrics); }, [sessionMetrics]);
  useEffect(() => { saveJson(LS_KEYS.apiSettings, apiSettings); }, [apiSettings]);
  useEffect(() => { saveJson(LS_KEYS.authState, authState); }, [authState]);
  useEffect(() => { saveJson(LS_KEYS.syncPrefs, syncPrefs); }, [syncPrefs]);
  useEffect(() => { saveJson(LS_KEYS.practiceSettings, practiceSettings); }, [practiceSettings]);
  useEffect(() => { saveJson(LS_KEYS.onboarding, { completed: onboardingDone }); }, [onboardingDone]);
  useEffect(() => { saveJson(LS_KEYS.analysisHistory, analysisHistory.slice(0, 10)); }, [analysisHistory]);

  // ─── Google Sign-In ─────────────────────────────────────
  const startGoogleSignIn = async () => {
    const clientId = authState.googleClientId?.trim();
    if (!clientId) { setApiStatus({ kind: "error", message: "Google Client ID required" }); return false; }
    try {
      const tokenResponse = await requestGoogleAccessToken({ clientId, prompt: "consent" });
      const accessToken = tokenResponse.access_token;
      const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
      const user = await fetchGoogleProfile(accessToken);
      setAuthState((prev) => ({ ...prev, accessToken, expiresAt, user }));
      setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "Google sign-in successful" }));
      return true;
    } catch { setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "Google sign-in failed" })); return false; }
  };

  const signOutGoogle = () => {
    setAuthState((prev) => ({ ...prev, accessToken: "", expiresAt: 0, user: null, backupFileId: "" }));
    setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "Signed out" }));
  };

  const buildBackupPayload = () => ({
    schemaVersion: 1, updatedAt: new Date().toISOString(), deviceId: navigator.userAgent,
    wordStats, sessionMetrics, apiSettings, practiceSettings, lang, tab,
  });

  const syncNow = async () => {
    try {
      if (!isTokenValid(authState)) { setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "Sign in required for Drive sync" })); return false; }
      const existing = authState.backupFileId ? { id: authState.backupFileId } : await findDriveBackupFile(authState.accessToken);
      const result = await uploadBackupToDrive({ accessToken: authState.accessToken, backupFileId: existing?.id, payload: buildBackupPayload() });
      setAuthState((prev) => ({ ...prev, backupFileId: result.id || existing?.id || "" }));
      setSyncPrefs((prev) => ({ ...prev, lastSyncAt: new Date().toISOString(), lastSyncStatus: "Synced to Google Drive" }));
      return true;
    } catch { setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "Drive sync failed" })); return false; }
  };

  const restoreFromDriveHandler = async () => {
    try {
      if (!isTokenValid(authState)) { setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "Sign in required to restore" })); return false; }
      const existing = authState.backupFileId ? { id: authState.backupFileId } : await findDriveBackupFile(authState.accessToken);
      if (!existing?.id) { setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "No backup found in Drive" })); return false; }
      const payload = await restoreBackupFromDrive(authState.accessToken, existing.id);
      if (payload?.wordStats) setWordStats(payload.wordStats);
      if (payload?.sessionMetrics) setSessionMetrics(normalizeSessionMetrics(payload.sessionMetrics));
      if (payload?.apiSettings) setApiSettings(normalizeApiSettings(payload.apiSettings));
      if (payload?.practiceSettings) setPracticeSettings(normalizePracticeSettings(payload.practiceSettings));
      if (payload?.lang) setLang(payload.lang);
      if (payload?.tab) setTab(payload.tab);
      setAuthState((prev) => ({ ...prev, backupFileId: existing.id }));
      setSyncPrefs((prev) => ({ ...prev, lastSyncAt: new Date().toISOString(), lastSyncStatus: "Restored from Google Drive" }));
      return true;
    } catch { setSyncPrefs((prev) => ({ ...prev, lastSyncStatus: "Restore failed" })); return false; }
  };

  // ─── Auto-sync ──────────────────────────────────────────
  useEffect(() => {
    if (!syncPrefs.autoSync || !isTokenValid(authState)) return;
    const timer = setTimeout(() => syncNow(), 900);
    return () => clearTimeout(timer);
  }, [wordStats, sessionMetrics, apiSettings, syncPrefs.autoSync, authState.accessToken, authState.expiresAt]);

  // ─── recordMetric ───────────────────────────────────────
  const recordMetric = (metricKey, amount = 1, typeKey = null) => {
    const today = todayKey();
    setSessionMetrics((prev) => {
      const normalized = normalizeSessionMetrics(prev);
      const shouldResetWeek = normalized.weekStart !== startOfWeekKey();
      const baseMetrics = shouldResetWeek ? normalizeSessionMetrics(DEFAULT_SESSION_METRICS) : normalized;
      const dayBase = baseMetrics.daily[today] || defaultDailyMetrics();
      const nextDaily = { ...dayBase, [metricKey]: Math.max(0, Number(dayBase[metricKey] || 0) + amount), byType: { ...dayBase.byType } };
      if (typeKey && nextDaily.byType[typeKey] !== undefined) nextDaily.byType[typeKey] = Math.max(0, Number(nextDaily.byType[typeKey] || 0) + amount);
      return { ...baseMetrics, weekStart: startOfWeekKey(), daily: { ...baseMetrics.daily, [today]: nextDaily } };
    });
  };

  // ─── response profiles ─────────────────────────────────
  const thisWeek = normalizeSessionMetrics(sessionMetrics);
  const profileTotals = Object.values(thisWeek.daily || {}).reduce((acc, day) => ({
    waits: acc.waits + (day.waits || 0), frustrationEpisodes: acc.frustrationEpisodes + (day.frustrationEpisodes || 0),
    aacMessages: acc.aacMessages + (day.aacMessages || 0), jointAttentionBids: acc.jointAttentionBids + (day.jointAttentionBids || 0),
  }), { waits: 0, frustrationEpisodes: 0, aacMessages: 0, jointAttentionBids: 0 });
  const responseProfiles = [
    profileTotals.aacMessages >= 8 ? (lang === "te" ? "AAC-ప్రతిస్పందన బలంగా ఉంది" : "AAC responder") : null,
    profileTotals.jointAttentionBids >= 6 ? (lang === "te" ? "జాయింట్-అటెన్షన్ బలంగా ఉంది" : "Joint-attention responder") : null,
    profileTotals.frustrationEpisodes >= 5 ? (lang === "te" ? "రెగ్యులేషన్ సపోర్ట్ అవసరం" : "Needs regulation support") : null,
    profileTotals.waits >= 8 ? (lang === "te" ? "వెయిట్-టోలరెన్స్ పెరుగుతోంది" : "Wait-tolerance improving") : null,
  ].filter(Boolean);

  // ─── AI helpers ─────────────────────────────────────────
  const askTip = async (word, currentLang, idx) => {
    if (apiSettings.providerId === "offline" || !(apiSettings.apiKeys?.[apiSettings.providerId] || "").trim()) {
      setApiStatus({ kind: "offline", message: currentLang === "te" ? "ఆఫ్లైన్ చిట్కా ఉపయోగిస్తున్నాం" : "Using offline tip" });
      await new Promise((r) => setTimeout(r, 250));
      return offlineTip(word, currentLang, idx);
    }
    try {
      const prompt = currentLang === "te"
        ? `జెస్సీ కోసం "${word.word}" పదం ప్రాక్టీస్ చేయడానికి 2-3 వాక్యాల్లో ఒక సరళమైన చిట్కా ఇవ్వండి.`
        : `Give one practical 2-3 sentence speech practice tip for the word "${word.word}" for Jessy.`;
      const text = await requestProviderCompletion({ settings: apiSettings, messages: [{ role: "system", content: "You are a pediatric speech therapy coaching assistant. Keep advice short, practical, and warm." }, { role: "user", content: prompt }], intent: "tip" });
      setApiStatus({ kind: "connected", message: "Tip generated" });
      return text;
    } catch (err) {
      setApiStatus({ kind: "error", message: `Fallback used (${err?.code || "local"})` });
      return offlineTip(word, currentLang, idx);
    }
  };

  const requestCoachReply = async ({ text, lang: currentLang, signal, history }) => {
    if (apiSettings.providerId === "offline" || !(apiSettings.apiKeys?.[apiSettings.providerId] || "").trim()) {
      setApiStatus({ kind: "offline", message: currentLang === "te" ? "ఆఫ్లైన్ చాట్ యాక్టివ్" : "Offline chat active" });
      await new Promise((r) => setTimeout(r, 260));
      return offlineChat(text, currentLang);
    }
    try {
      const system = currentLang === "te"
        ? "మీరు పిల్లల స్పీచ్ కోచ్ అసిస్టెంట్. 3-5 చిన్న వాక్యాల్లో స్పష్టమైన, ప్రాక్టికల్ సలహా ఇవ్వండి."
        : "You are a warm pediatric speech coach assistant. Reply in 3-5 short practical sentences.";
      const apiHistory = history.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const answer = await requestProviderCompletion({ settings: apiSettings, messages: [{ role: "system", content: system }, ...apiHistory], signal, intent: "chat" });
      setApiStatus({ kind: "connected", message: "Connected" });
      return answer;
    } catch (err) {
      if (err?.name === "AbortError") return currentLang === "te" ? "రిక్వెస్ట్ ఆపబడింది." : "Request cancelled.";
      setApiStatus({ kind: "error", message: err?.code === 401 ? "Invalid API key" : err?.code === 429 ? "Rate limit reached" : "Provider error" });
      return offlineChat(text, currentLang);
    }
  };

  const markComplete = (section) => setCompletedSections(new Set([...completedSections, section]));

  // ─── Tabs definition ───────────────────────────────────
  const tabs = [
    { id: "routine", label: lang === 'te' ? 'దినచర్య' : 'Routine', icon: ListChecks },
    { id: "imitation", label: lang === 'te' ? 'అనుకరణ' : 'Imitate', icon: Repeat2 },
    { id: "words", label: lang === 'te' ? 'పదాలు' : 'Words', icon: Mic },
    { id: "songs", label: lang === 'te' ? 'పాటలు' : 'Songs', icon: Music2 },
    { id: "joint", label: lang === 'te' ? 'జాయింట్' : 'Joint', icon: Users },
    { id: "speechGames", label: lang === 'te' ? 'స్పీచ్ గేమ్స్' : 'Speech Games', icon: Gamepad2 },
    { id: "dashboard", label: lang === 'te' ? 'ప్రోగ్రెస్' : 'Progress', icon: CheckCheck },
    { id: "feedback", label: lang === 'te' ? 'కేర్‌గివర్' : 'Caregiver', icon: Settings2 },
    { id: "games", label: lang === 'te' ? 'గేమ్స్' : 'Games', icon: Gamepad2 },
    { id: "ai", label: lang === 'te' ? 'AI సహాయం' : 'AI Help', icon: Bot },
  ];

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="app-shell" style={{ width: "100%", maxWidth: 920, margin: "0 auto", minHeight: "100vh", fontFamily: FONT_BODY, background: `radial-gradient(circle at 20% 0%, ${C.bgSoft}, ${C.bg})` }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatAura { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.03); } 100% { transform: translateY(0) scale(1); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .app-shell::before { content: ""; position: fixed; inset: 0; pointer-events: none; background: radial-gradient(circle at 10% 8%, rgba(143,160,255,0.2), transparent 35%), radial-gradient(circle at 88% 12%, rgba(84,229,218,0.16), transparent 30%), radial-gradient(circle at 52% 100%, rgba(255,216,135,0.14), transparent 40%); z-index: 0; }
        .app-shell > * { position: relative; z-index: 1; }
        button { font-family: ${FONT_BODY}; touch-action: manipulation; }
        input, select, textarea { font-family: ${FONT_BODY}; }
        input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid ${C.secondary}; outline-offset: 2px; box-shadow: 0 0 0 4px rgba(67, 217, 207, 0.18); }
        .top-tabs { display: flex; gap: 8px; margin-top: 16px; background: linear-gradient(150deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08)); border-radius: 18px; padding: 8px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.25); box-shadow: inset 0 1px 0 rgba(255,255,255,0.26), 0 8px 24px rgba(4,8,20,0.22); }
        .top-tab-btn { flex: 1 0 82px; min-height: 46px; padding: 8px 6px; border-radius: 13px; border: none; font-weight: 800; font-size: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all .22s; }
        .top-tab-btn:hover { transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        @media (max-width: 768px) { body { overflow-x: hidden; } .responsive-two-col { grid-template-columns: 1fr !important; } .top-tab-btn { flex-basis: 88px; font-size: 12px; } }
      `}</style>
      {!onboardingDone ? (
        <OnboardingScreen lang={lang} apiSettings={apiSettings} setApiSettings={setApiSettings} practiceSettings={practiceSettings} setPracticeSettings={setPracticeSettings} authState={authState} setAuthState={setAuthState} onComplete={() => setOnboardingDone(true)} startGoogleSignIn={startGoogleSignIn} syncNow={syncNow} syncStatus={{ kind: syncPrefs.lastSyncStatus?.includes("failed") ? "error" : "ok", message: syncPrefs.lastSyncStatus }} />
      ) : (
        <>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, rgba(129,148,255,.8), rgba(57,196,183,.74), rgba(33,60,122,.78))`, padding: "20px 16px 24px", borderRadius: "0 0 28px 28px", color: "white", position: "relative", borderBottom: `1px solid ${C.border}`, boxShadow: "0 22px 38px rgba(5,10,25,.42)", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -46, width: 148, height: 148, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.36), rgba(255,255,255,0.02) 72%)", filter: "blur(1px)", animation: "floatAura 7.5s ease-in-out infinite" }} />
            <div style={{ position: "absolute", left: -26, bottom: -54, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(84,229,218,0.26), rgba(84,229,218,0.02) 70%)", animation: "floatAura 8.2s ease-in-out infinite" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_HEADING }}><Sparkles size={20} />{lang === 'te' ? 'జెస్సీ స్పీచ్ కోచ్' : 'Jessy Speech Coach'}</div>
                <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{lang === 'te' ? 'AI-ఆధారిత స్పీచ్ థెరపీ సహాయకుడు' : 'AI-powered speech therapy companion'}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <motion.button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} {...makeTap(reduceMotion)} style={{ minHeight: 44, padding: "6px 14px", borderRadius: 20, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", backdropFilter: "blur(4px)", display: "inline-flex", alignItems: "center", gap: 7 }}><Languages size={14} />{lang === 'en' ? 'తెలుగు' : 'English'}</motion.button>
                <motion.button onClick={() => setOnboardingDone(false)} {...makeTap(reduceMotion)} style={{ minHeight: 44, padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Settings2 size={13} /> Setup</motion.button>
              </div>
            </div>
            <div className="top-tabs">
              {tabs.map(t => (
                <motion.button key={t.id} onClick={() => setTab(t.id)} {...makeTap(reduceMotion)} style={{ background: tab === t.id ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.06)", color: tab === t.id ? "#192D64" : "rgba(255,255,255,0.94)", boxShadow: tab === t.id ? "0 8px 18px rgba(17,32,73,0.26)" : "inset 0 0 0 1px rgba(255,255,255,0.09)" }} className="top-tab-btn"><t.icon size={16} />{t.label}</motion.button>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.96)", display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)", padding: "6px 10px", borderRadius: 999, backdropFilter: "blur(6px)" }}>
              <CheckCheck size={13} />
              {lang === "te" ? `ఈ రోజు పూర్తి చేసిన సెక్షన్లు: ${completedSections.size}/5` : `Completed today: ${completedSections.size}/5 sections`}
            </div>
            {responseProfiles.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {responseProfiles.map((p) => <span key={p} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.13)", color: "white", fontWeight: 700 }}>{p}</span>)}
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: 16, marginTop: 6 }}>
            <div style={{ ...CARD_STYLE, borderRadius: 22, padding: 12, background: "linear-gradient(145deg, rgba(20,32,60,0.62), rgba(11,18,36,0.44))" }}>
              <AnimatePresence mode="wait">
                <motion.div key={tab} {...makeFadeUp(reduceMotion)}>
                  <Suspense fallback={<TabLoader />}>
                    {tab === "routine" && <RoutineTab lang={lang} recordMetric={recordMetric} onComplete={() => markComplete("routine")} />}
                    {tab === "imitation" && <ImitationTab lang={lang} level1Target={practiceSettings.level1Target} recordMetric={recordMetric} onComplete={() => markComplete("imitation")} />}
                    {tab === "words" && <WordPracticeTab lang={lang} onComplete={() => markComplete("words")} askTip={askTip} wordStats={wordStats} setWordStats={setWordStats} level1Target={practiceSettings.level1Target} communicationMode={practiceSettings.communicationMode} recordMetric={recordMetric} />}
                    {tab === "songs" && <SongTab lang={lang} level1Target={practiceSettings.level1Target} recordMetric={recordMetric} onComplete={() => markComplete("songs")} />}
                    {tab === "joint" && <JointAttentionTab lang={lang} recordMetric={recordMetric} onComplete={() => markComplete("joint")} />}
                    {tab === "speechGames" && <SpeechGamesTab lang={lang} practiceSettings={practiceSettings} setPracticeSettings={setPracticeSettings} recordMetric={recordMetric} sessionMetrics={sessionMetrics} />}
                    {tab === "dashboard" && <DashboardTab lang={lang} sessionMetrics={sessionMetrics} />}
                    {tab === "feedback" && <CaregiverFeedbackTab lang={lang} />}
                    {tab === "games" && <SyllablePopTab lang={lang} words={CORE_WORDS_EXPANDED} theme={C} />}
                    {tab === "ai" && <AiChatTab lang={lang} apiSettings={apiSettings} setApiSettings={setApiSettings} apiStatus={apiStatus} setApiStatus={setApiStatus} requestCoachReply={requestCoachReply} authState={authState} setAuthState={setAuthState} syncPrefs={syncPrefs} setSyncPrefs={setSyncPrefs} syncNow={syncNow} restoreFromDrive={restoreFromDriveHandler} startGoogleSignIn={startGoogleSignIn} signOutGoogle={signOutGoogle} analysisHistory={analysisHistory} setAnalysisHistory={setAnalysisHistory} />}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 16px 20px", textAlign: "center", fontSize: 12, color: C.textLight, lineHeight: 1.5 }}>
            {lang === 'te' ? 'ఇది వృత్తిపరమైన వైద్య సలహాకు బదులు కాదు. జెస్సీ SLP థెరపీని కొనసాగించండి.' : 'This is not a substitute for professional medical advice. Continue Jessy\'s SLP therapy.'}
          </div>
        </>
      )}
    </div>
  );
}