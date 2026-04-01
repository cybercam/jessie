import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users, User, Sparkles, Circle, Apple, Hand, ArrowRight,
  Star, CheckCircle2, X, PawPrint, Footprints, ChevronDown,
  Heart, Mic, Volume2,
} from "lucide-react";
import { C, CARD_STYLE } from "../../data/constants";
import { IMAGE_ASSETS } from "../../data/words";

// ─── icon / visual helpers ───────────────────────────────

export const getWordIcon = (word) => {
  const map = {
    amma: Users, nanna: User, water: Sparkles, milk: Circle, food: Apple, want: Hand, come: ArrowRight,
    go: ArrowRight, play: Star, eat: Apple, sleep: Circle, yes: CheckCircle2, no: X, more: Sparkles,
    help: Heart, happy: Sparkles, sad: Heart, apple: Apple, ball: Circle, dog: PawPrint, cat: PawPrint,
    bird: Sparkles, book: Sparkles, shoe: Footprints, clap: Hand, jump: Footprints, look: Sparkles,
    wash: Sparkles, sit: Circle, stand: User, open: ChevronDown, stop: X,
  };
  return map[word] || Circle;
};

export const StageIcon = ({ stage, size = 46, color = C.text }) => {
  const Icon = stage === "body" ? Footprints : stage === "mouth" ? Mic : Volume2;
  return <Icon size={size} color={color} strokeWidth={2.2} />;
};

export const getImitationFallbackVisual = (item, stage) => {
  if (item?.emoji) {
    return (
      <span aria-hidden style={{ fontSize: 46, lineHeight: 1 }}>
        {item.emoji}
      </span>
    );
  }
  return <StageIcon stage={stage} size={50} color={C.secondary} />;
};

export const getItemVisual = (item) => {
  if (!item) return { src: "", alt: "" };
  if (item.imageUrl) return { src: item.imageUrl, alt: item.imageAlt || item.word || item.action || item.title || "Practice image" };
  if (item.imageKey && IMAGE_ASSETS[item.imageKey]) {
    return {
      src: IMAGE_ASSETS[item.imageKey],
      alt: item.imageAlt || item.word || item.action || item.title || "Practice image",
    };
  }
  return { src: "", alt: "" };
};

// ─── reusable components ─────────────────────────────────

export function MediaThumb({ item, fallback, size = 78, radius = 20 }) {
  const [failed, setFailed] = useState(false);
  const visual = getItemVisual(item);
  const showImage = Boolean(visual.src) && !failed;
  return (
    <div style={{
      width: size,
      height: size,
      margin: "0 auto 10px",
      borderRadius: radius,
      background: "rgba(255,255,255,0.05)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      {showImage ? (
        <img
          src={visual.src}
          alt={visual.alt}
          onError={() => setFailed(true)}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : fallback}
    </div>
  );
}

export function SpeechSynthButton({ text, lang = "en", size = "md" }) {
  const reduceMotion = useReducedMotion();
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "te" ? "te-IN" : "en-US";
      u.rate = 0.7;
      u.pitch = 1.1;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  };
  const s = size === "lg" ? 48 : size === "sm" ? 28 : 36;
  return (
    <motion.button onClick={speak} {...makeTap(reduceMotion)} style={{
      width: s, height: s, borderRadius: "50%", border: "none",
      background: speaking ? C.secondary : C.primaryLight,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s", flexShrink: 0,
      boxShadow: speaking ? `0 0 0 3px ${C.secondary}4A, 0 10px 18px rgba(5,10,25,.42)` : "0 10px 18px rgba(5,10,25,.35)",
    }}>
      <Volume2 size={s * 0.45} color={speaking ? "#042422" : C.text} />
    </motion.button>
  );
}

export function StarRating({ value, onChange, max = 5 }) {
  const reduceMotion = useReducedMotion();
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }, (_, i) => (
        <motion.button key={i} onClick={() => onChange(i + 1)} {...makeTap(reduceMotion)} style={{
          background: "none", border: "none", cursor: "pointer",
          opacity: i < value ? 1 : 0.3, transition: "all 0.15s",
          transform: i < value ? "scale(1.1)" : "scale(1)",
          color: i < value ? C.accent : C.textLight,
        }}>
          <Star size={24} fill={i < value ? C.accent : "transparent"} />
        </motion.button>
      ))}
    </div>
  );
}

export function ProgressRing({ value, max, size = 60, color = C.primary }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: 14, fontWeight: 700, fill: C.text }}>
        {value}/{max}
      </text>
    </svg>
  );
}

// ─── caregiver model line ────────────────────────────────

export const caregiverModelLine = (word, lang) => (
  lang === "te"
    ? `మోడల్ వాక్యం: "నాకు ${word} కావాలి". ఒత్తిడి లేకుండా 2-3 సార్లు మాత్రమే చెప్పండి.`
    : `Caregiver model: "I want ${word}." Model it 2-3 times without pressure.`
);

// ─── framer-motion presets ───────────────────────────────

export const makeFadeUp = (reduceMotion) => ({
  initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
  transition: { duration: reduceMotion ? 0.12 : 0.28, ease: "easeOut" },
});

export const makeTap = (reduceMotion) => ({
  whileTap: reduceMotion ? {} : { scale: 0.98 },
  whileHover: reduceMotion ? {} : { scale: 1.01 },
});
