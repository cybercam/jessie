import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { C, CARD_STYLE, SPEECH_GAME_TYPES, REINFORCER_OPTIONS } from "../../data/constants";
import { normalizeSpeechGameSettings, normalizePracticeSettings, normalizeSessionMetrics } from "../../utils/helpers";
import { makeTap } from "../shared";
import ReadySetGoGame from "../games/ReadySetGoGame";
import BubbleRequestGame from "../games/BubbleRequestGame";
import ChoiceGame from "../games/ChoiceGame";
import CopyMeGame from "../games/CopyMeGame";
import HelpOpenGame from "../games/HelpOpenGame";
import MoreAgainGame from "../games/MoreAgainGame";

export default function SpeechGamesTab({ lang, practiceSettings, setPracticeSettings, recordMetric, sessionMetrics }) {
  const [selectedGame, setSelectedGame] = useState("readySetGo");
  const [hint, setHint] = useState("");
  const speechSettings = normalizeSpeechGameSettings(practiceSettings?.speechGames);
  const activeConfig = speechSettings.games[selectedGame];
  const activeTargetsInput = (activeConfig.targets || []).join(", ");

  const updateSpeechSettings = (patch) => {
    setPracticeSettings((prev) => normalizePracticeSettings({ ...prev, speechGames: { ...(prev?.speechGames || speechSettings), ...patch } }));
  };
  const updateGameConfig = (gameId, patch) => {
    updateSpeechSettings({ games: { ...speechSettings.games, [gameId]: { ...speechSettings.games[gameId], ...patch } } });
  };
  const handleTargetsInput = (value) => {
    const targets = value.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean).slice(0, 6);
    if (targets.length === 0) return;
    updateGameConfig(selectedGame, { targets });
  };
  const trackPreferredWord = (word) => {
    if (!word) return;
    const map = { ...(speechSettings.preferredWordCounts || {}) };
    map[word] = Number(map[word] || 0) + 1;
    updateSpeechSettings({ preferredWordCounts: map });
  };

  const onGameEvent = ({ gameId, responseType, target, reinforcer, attemptAccepted, targetMatched }) => {
    recordMetric?.("gameAttempts", 1, gameId);
    if (attemptAccepted) recordMetric?.("gameAcceptedAttempts", 1, gameId);
    if (targetMatched) { recordMetric?.("gameTargetMatches", 1, gameId); trackPreferredWord(target); }
    if (responseType === "tapSelection") recordMetric?.("tapResponses", 1, gameId);
    if (responseType === "aacSelection") recordMetric?.("aacResponses", 1, gameId);
    if (responseType === "caregiverMarkedGesture") recordMetric?.("gestureResponses", 1, gameId);
    if (responseType === "caregiverMarkedVocalAttempt") recordMetric?.("vocalResponses", 1, gameId);
    if (responseType === "imitationAttempt") recordMetric?.("imitationResponses", 1, gameId);
    if (reinforcer === "bubbles") recordMetric?.("reinforcerBubbles", 1, gameId);
    if (reinforcer === "spin") recordMetric?.("reinforcerSpin", 1, gameId);
    if (reinforcer === "clap") recordMetric?.("reinforcerClap", 1, gameId);
    if (reinforcer === "stars") recordMetric?.("reinforcerStars", 1, gameId);
    if (reinforcer === "cheer") recordMetric?.("reinforcerCheer", 1, gameId);
  };

  const thisWeek = normalizeSessionMetrics(sessionMetrics);
  const gameSums = Object.values(thisWeek.daily).reduce((acc, day) => {
    acc.attempts += Number(day.gameAttempts || 0);
    acc.accepted += Number(day.gameAcceptedAttempts || 0);
    return acc;
  }, { attempts: 0, accepted: 0 });
  const successRate = gameSums.accepted / Math.max(1, gameSums.attempts);
  const topWords = Object.entries(speechSettings.preferredWordCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const firstEnabledReinforcer = REINFORCER_OPTIONS.find((r) => speechSettings.reinforcerPool?.[r.id])?.id || "bubbles";
  const activeReinforcer = speechSettings.reinforcerPool?.[activeConfig.reinforcer]
    ? activeConfig.reinforcer
    : (speechSettings.reinforcerPool?.[speechSettings.preferredReinforcer] ? speechSettings.preferredReinforcer : firstEnabledReinforcer);

  const commonGameProps = {
    lang, onGameEvent, onSessionHint: (kind) => setHint(kind),
    settings: {
      ...activeConfig, level: speechSettings.level, advanceThreshold: speechSettings.advanceThreshold,
      responseMode: speechSettings.responseMode, bilingualLabels: speechSettings.bilingualLabels,
      audioModel: speechSettings.audioModel, voicePrompts: speechSettings.voicePrompts, reinforcer: activeReinforcer,
    },
  };

  const gameView = {
    readySetGo: <ReadySetGoGame {...commonGameProps} />,
    bubbleRequest: <BubbleRequestGame {...commonGameProps} />,
    choice: <ChoiceGame {...commonGameProps} />,
    copyMe: <CopyMeGame {...commonGameProps} />,
    helpOpen: <HelpOpenGame {...commonGameProps} />,
    moreAgain: <MoreAgainGame {...commonGameProps} />,
  }[selectedGame];

  useEffect(() => {
    if (!speechSettings.autoAdjustDifficulty || (hint !== "advance" && hint !== "simplify")) return;
    const nextLevel = hint === "advance" ? Math.min(4, speechSettings.level + 1) : Math.max(1, speechSettings.level - 1);
    if (nextLevel !== speechSettings.level) updateSpeechSettings({ level: nextLevel });
    setHint("");
  }, [hint, speechSettings.autoAdjustDifficulty, speechSettings.level]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ ...CARD_STYLE, borderRadius: 14, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 17 }}>{lang === "te" ? "సింపుల్ స్పీచ్ గేమ్స్" : "Simple Speech Games"}</div>
            <div style={{ color: C.textLight, fontSize: 12 }}>{lang === "te" ? "చిన్న లూప్స్, పెద్ద కమ్యూనికేషన్ అవకాశాలు" : "Short loops, high communication opportunities"}</div>
          </div>
          <div style={{ color: C.textLight, fontSize: 12 }}>
            {lang === "te" ? "వీక్లీ అక్సెప్టెడ్ రేట్" : "Weekly accepted rate"}:{" "}
            <strong style={{ color: C.success }}>{Math.round(successRate * 100)}%</strong>
          </div>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 10 }}>
          <label style={{ color: C.textLight, fontSize: 12 }}>
            {lang === "te" ? "డిఫికల్టీ లెవెల్" : "Difficulty level"}
            <select value={speechSettings.level} onChange={(e) => updateSpeechSettings({ level: Number(e.target.value) })} style={{ width: "100%", marginTop: 4, borderRadius: 10, minHeight: 44, border: `1px solid ${C.border}`, background: C.bgSoft, color: C.text, padding: "8px 10px" }}>
              <option value={1}>Level 1</option><option value={2}>Level 2</option><option value={3}>Level 3</option><option value={4}>Level 4</option>
            </select>
          </label>
          <label style={{ color: C.textLight, fontSize: 12 }}>
            {lang === "te" ? "రెస్పాన్స్ మోడ్" : "Response mode"}
            <select value={speechSettings.responseMode} onChange={(e) => updateSpeechSettings({ responseMode: e.target.value })} style={{ width: "100%", marginTop: 4, borderRadius: 10, minHeight: 44, border: `1px solid ${C.border}`, background: C.bgSoft, color: C.text, padding: "8px 10px" }}>
              <option value="tap-only">{lang === "te" ? "ట్యాప్ మాత్రమే" : "Tap only"}</option>
              <option value="tap-speech">{lang === "te" ? "ట్యాప్ + స్పీచ్" : "Tap + speech"}</option>
              <option value="aac">{lang === "te" ? "AAC సెలెక్ట్" : "AAC"}</option>
              <option value="imitation">{lang === "te" ? "ఇమిటేషన్" : "Imitation"}</option>
            </select>
          </label>
          <label style={{ color: C.textLight, fontSize: 12 }}>
            {lang === "te" ? "ప్రిఫర్డ్ రివార్డ్" : "Preferred reinforcer"}
            <select value={speechSettings.preferredReinforcer} onChange={(e) => updateSpeechSettings({ preferredReinforcer: e.target.value })} style={{ width: "100%", marginTop: 4, borderRadius: 10, minHeight: 44, border: `1px solid ${C.border}`, background: C.bgSoft, color: C.text, padding: "8px 10px" }}>
              {REINFORCER_OPTIONS.map((r) => <option key={r.id} value={r.id}>{lang === "te" ? r.te : r.en}</option>)}
            </select>
          </label>
          <label style={{ color: C.textLight, fontSize: 12 }}>
            {lang === "te" ? "ఈ గేమ్ రివార్డ్" : "This game reinforcer"}
            <select value={activeConfig.reinforcer || speechSettings.preferredReinforcer} onChange={(e) => updateGameConfig(selectedGame, { reinforcer: e.target.value })} style={{ width: "100%", marginTop: 4, borderRadius: 10, minHeight: 44, border: `1px solid ${C.border}`, background: C.bgSoft, color: C.text, padding: "8px 10px" }}>
              {REINFORCER_OPTIONS.map((r) => <option key={`g-${r.id}`} value={r.id}>{lang === "te" ? r.te : r.en}</option>)}
            </select>
          </label>
          <label style={{ color: C.textLight, fontSize: 12 }}>
            {lang === "te" ? "గేమ్ టార్గెట్స్ (comma separated)" : "Game targets (comma separated)"}
            <input key={`targets-${selectedGame}`} defaultValue={activeTargetsInput} onBlur={(e) => handleTargetsInput(e.target.value)} style={{ width: "100%", marginTop: 4, borderRadius: 10, minHeight: 44, border: `1px solid ${C.border}`, background: C.bgSoft, color: C.text, padding: "8px 10px" }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          {REINFORCER_OPTIONS.map((r) => (
            <label key={`pool-${r.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textLight }}>
              <input type="checkbox" checked={Boolean(speechSettings.reinforcerPool?.[r.id])} onChange={(e) => updateSpeechSettings({ reinforcerPool: { ...speechSettings.reinforcerPool, [r.id]: e.target.checked } })} />
              <span>{r.emoji}</span> {lang === "te" ? r.te : r.en}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {[
            { key: "voicePrompts", en: "Voice prompts", te: "వాయిస్ ప్రాంప్ట్స్" },
            { key: "audioModel", en: "Audio model", te: "ఆడియో మోడల్" },
            { key: "bilingualLabels", en: "Bilingual labels", te: "రెండు భాషల లేబుల్స్" },
            { key: "autoAdjustDifficulty", en: "Auto adjust level", te: "ఆటో లెవెల్ అడ్జస్ట్" },
          ].map((toggle) => (
            <label key={toggle.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textLight }}>
              <input type="checkbox" checked={Boolean(speechSettings[toggle.key])} onChange={(e) => updateSpeechSettings({ [toggle.key]: e.target.checked })} />
              {lang === "te" ? toggle.te : toggle.en}
            </label>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.textLight }}>
          {lang === "te" ? "టాప్ ప్రిఫర్డ్ పదాలు:" : "Top preferred words:"}{" "}
          {topWords.length ? topWords.map(([word, count]) => `${word} (${count})`).join(", ") : (lang === "te" ? "ఇంకా డేటా లేదు" : "No data yet")}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SPEECH_GAME_TYPES.map((game) => (
          <motion.button key={game.id} onClick={() => setSelectedGame(game.id)} {...makeTap(false)} style={{
            minHeight: 52, borderRadius: 12, border: `1px solid ${selectedGame === game.id ? C.secondary : C.border}`,
            background: selectedGame === game.id ? C.secondaryLight : "rgba(255,255,255,0.03)",
            color: C.text, fontWeight: 800, cursor: "pointer", padding: "8px 12px",
          }}>
            <span aria-hidden>{game.icon}</span> {lang === "te" ? game.te : game.en}
          </motion.button>
        ))}
      </div>

      {gameView}
    </div>
  );
}
