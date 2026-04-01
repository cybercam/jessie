import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { C, CARD_STYLE, TELUGU_MAP, REINFORCER_OPTIONS } from "../../data/constants";
import { makeFadeUp, makeTap } from "../shared";
import { isAcceptableAttempt } from "../../utils/fuzzySpeechScore";

// ─── label / icon helpers ────────────────────────────────

export function getWordLabel(word, lang, bilingual = true) {
  const english = String(word || "").trim().toLowerCase();
  const telugu = TELUGU_MAP[english] || english;
  if (lang === "te") return bilingual ? `${telugu} / ${english}` : telugu;
  return bilingual ? `${english} / ${telugu}` : english;
}

export function getSpeechGameIcon(word) {
  const key = String(word || "").trim().toLowerCase();
  const iconMap = {
    more: "➕", go: "🏁", open: "📦", help: "🛟", again: "🔁",
    yes: "✅", no: "✋", ball: "⚽", apple: "🍎", book: "📘",
    car: "🚗", bus: "🚌", dog: "🐶", cat: "🐱", baa: "🐑",
    mmm: "😋", pa: "👄", tap: "☝️", clap: "👏", blow: "💨",
  };
  return iconMap[key] || "✨";
}

export function getReinforcerMeta(id) {
  return REINFORCER_OPTIONS.find((item) => item.id === id) || REINFORCER_OPTIONS[0];
}

// ─── evaluation (with fuzzy fallback) ────────────────────

export function evaluateSpeechAttempt({ responseMode, responseType, selectedWord, targets, phraseTarget, level }) {
  const normalized = String(selectedWord || "").trim().toLowerCase();
  const responseKey = responseType || "tapSelection";
  const allowed = {
    "tap-only": ["tapSelection"],
    "tap-speech": ["tapSelection", "caregiverMarkedVocalAttempt", "caregiverMarkedGesture"],
    "aac": ["aacSelection", "caregiverMarkedGesture"],
    "imitation": ["imitationAttempt", "caregiverMarkedGesture", "caregiverMarkedVocalAttempt"],
  };
  const isAllowed = (allowed[responseMode] || allowed["tap-speech"]).includes(responseKey);
  if (!isAllowed) {
    return { attemptAccepted: false, targetMatched: false, phraseMatched: false };
  }
  const hasSignalAttempt = responseKey !== "tapSelection" && responseKey !== "aacSelection";
  // Exact match first, then fuzzy fallback for vocal/imitation attempts
  const targetMatched = hasSignalAttempt
    ? true
    : targets.includes(normalized) || targets.some((t) => isAcceptableAttempt(t, normalized));
  const phraseMatched = level >= 3 && phraseTarget
    ? normalized === phraseTarget || (targetMatched && phraseTarget.includes(normalized))
    : false;
  const attemptAccepted = hasSignalAttempt || targetMatched;
  return { attemptAccepted, targetMatched, phraseMatched };
}

// ─── UI components ───────────────────────────────────────

export function GameWordButton({ label, active = false, onClick, icon = "💬" }) {
  return (
    <motion.button
      onClick={onClick}
      style={{
        minHeight: 96,
        width: "100%",
        borderRadius: 18,
        border: `2px solid ${active ? C.secondary : C.border}`,
        background: active
          ? `linear-gradient(160deg, ${C.secondaryLight}, rgba(255,255,255,0.08))`
          : "linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        color: C.text,
        fontWeight: 800,
        fontSize: 22,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        gap: 4,
        padding: "10px 12px",
        boxShadow: active ? "0 10px 22px rgba(84,229,218,0.2)" : "0 10px 22px rgba(4,8,20,0.25)",
      }}
    >
      <span
        style={{
          fontSize: 26,
          width: 40,
          height: 40,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(145deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
        aria-hidden
      >
        {icon}
      </span>
      <span style={{ fontSize: 20 }}>{label}</span>
    </motion.button>
  );
}

export function RewardLayer({ reward, lang }) {
  if (!reward?.active) return null;
  const meta = getReinforcerMeta(reward.reinforcer);
  return (
    <motion.div
      {...makeFadeUp(false)}
      style={{
        marginTop: 10,
        borderRadius: 16,
        border: `1px solid ${C.accent}`,
        background: C.accentLight,
        color: C.text,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 24 }} aria-hidden>{meta.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>
        {lang === "te" ? "ప్రయత్నం అద్భుతం! వెంటనే రివార్డ్." : "Great attempt! Reward now."}
      </span>
      <span style={{ fontSize: 24 }} aria-hidden>{meta.emoji}</span>
    </motion.div>
  );
}

export function CaregiverAssistBar({ lang, onMarkGesture, onMarkVocal, onMarkImitation, onReplayModel, responseMode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 8,
      marginTop: 10,
    }}>
      {responseMode !== "tap-only" && (
        <motion.button onClick={onMarkGesture} {...makeTap(false)} style={{
          minHeight: 50, borderRadius: 12, border: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.03)", color: C.text, fontWeight: 700, cursor: "pointer",
        }}>
          {lang === "te" ? "సంకేత ప్రయత్నం" : "Mark gesture"}
        </motion.button>
      )}
      {responseMode !== "tap-only" && responseMode !== "aac" && (
        <motion.button onClick={onMarkVocal} {...makeTap(false)} style={{
          minHeight: 50, borderRadius: 12, border: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.03)", color: C.text, fontWeight: 700, cursor: "pointer",
        }}>
          {lang === "te" ? "శబ్ద ప్రయత్నం" : "Mark vocal try"}
        </motion.button>
      )}
      {responseMode === "imitation" && (
        <motion.button onClick={onMarkImitation} {...makeTap(false)} style={{
          minHeight: 50, borderRadius: 12, border: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.03)", color: C.text, fontWeight: 700, cursor: "pointer",
        }}>
          {lang === "te" ? "అనుకరణ ప్రయత్నం" : "Mark imitation"}
        </motion.button>
      )}
      <motion.button onClick={onReplayModel} {...makeTap(false)} style={{
        minHeight: 50, borderRadius: 12, border: `1px solid ${C.secondary}`,
        background: C.secondaryLight, color: C.text, fontWeight: 700, cursor: "pointer",
      }}>
        {lang === "te" ? "మోడల్ మళ్లీ" : "Replay model"}
      </motion.button>
    </div>
  );
}

export function CommunicationGameShell({
  lang, title, subtitle, gameIcon, round, rounds,
  promptText, scene, response, aacStrip, reward, assistBar,
}) {
  return (
    <div style={{ ...CARD_STYLE, borderRadius: 16, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <span aria-hidden>{gameIcon}</span>
            {title}
          </div>
          <div style={{ fontSize: 12, color: C.textLight }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 12, color: C.textLight }}>
          {lang === "te" ? "రౌండ్" : "Round"} {round}/{rounds}
        </div>
      </div>
      <div style={{
        minHeight: 170, borderRadius: 16, border: `1px solid ${C.border}`,
        background: "rgba(255,255,255,0.03)", display: "grid", placeItems: "center",
        marginBottom: 10, padding: 10,
      }}>
        {scene}
      </div>
      <div style={{
        minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`,
        color: C.textLight, background: "rgba(255,255,255,0.03)",
        display: "grid", placeItems: "center", marginBottom: 10, fontWeight: 700,
      }}>
        {promptText}
      </div>
      <div>{response}</div>
      {aacStrip}
      <RewardLayer reward={reward} lang={lang} />
      {assistBar}
    </div>
  );
}

// ─── custom hook ─────────────────────────────────────────

export function useSpeechGameRound({ rounds = 6, onSessionHint, advanceThreshold = 0.7 }) {
  const [round, setRound] = useState(1);
  const [attempts, setAttempts] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [targetMatches, setTargetMatches] = useState(0);
  const [frustration, setFrustration] = useState(0);

  const logAttempt = ({ attemptAccepted, targetMatched }) => {
    setAttempts((v) => v + 1);
    if (attemptAccepted) setAccepted((v) => v + 1);
    if (targetMatched) setTargetMatches((v) => v + 1);
  };

  const nextRound = () => {
    setRound((v) => (v >= rounds ? 1 : v + 1));
  };

  useEffect(() => {
    if (!onSessionHint || attempts < 6) return;
    const rate = accepted / Math.max(1, attempts);
    if (rate >= advanceThreshold && frustration <= 1) onSessionHint("advance");
    if (rate <= 0.35 || frustration >= 3) onSessionHint("simplify");
  }, [attempts, accepted, frustration, onSessionHint, advanceThreshold]);

  return {
    round, attempts, accepted, targetMatches,
    frustration, setFrustration, logAttempt, nextRound,
  };
}
