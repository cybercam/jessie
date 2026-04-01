import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { C, CARD_STYLE, LEVEL_CONFIG } from "../../data/constants";
import { IMITATION_ACTIVITIES } from "../../data/words";
import { buildCountPool, clampLevel1Target } from "../../utils/helpers";
import { makeFadeUp, makeTap, StageIcon, MediaThumb, getImitationFallbackVisual } from "../shared";

export default function ImitationTab({ lang, onComplete, level1Target, recordMetric }) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState("body");
  const [level, setLevel] = useState(1);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [waitSeconds, setWaitSeconds] = useState(0);
  const stages = ["body", "mouth", "sound"];
  const stageNames = {
    body: lang === 'te' ? 'శరీరం' : 'Body',
    mouth: lang === 'te' ? 'నోరు' : 'Mouth',
    sound: lang === 'te' ? 'శబ్దం' : 'Sound',
  };
  const stagePool = IMITATION_ACTIVITIES.filter((a) => a.type === stage);
  const filtered = buildCountPool(stagePool, level, level1Target);
  const activity = filtered[currentIdx % filtered.length];

  useEffect(() => { setCurrentIdx(0); }, [stage, level, level1Target]);

  useEffect(() => {
    if (waitSeconds <= 0) return undefined;
    const timer = setInterval(() => { setWaitSeconds((prev) => Math.max(0, prev - 1)); }, 1000);
    return () => clearInterval(timer);
  }, [waitSeconds]);

  const markDone = () => {
    const key = `${stage}-${currentIdx}`;
    const newC = new Set(completed);
    newC.add(key);
    setCompleted(newC);
    if (newC.size >= 6) onComplete?.();
    recordMetric?.("functionalAttempts", 1, "imitation");
    setCurrentIdx((currentIdx + 1) % filtered.length);
  };

  return (
    <motion.div {...makeFadeUp(reduceMotion)}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {stages.map(s => (
          <motion.button key={s} onClick={() => { setStage(s); setCurrentIdx(0); }} {...makeTap(reduceMotion)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 14,
            border: `2px solid ${stage === s ? C.secondary : C.border}`,
            background: stage === s ? C.secondaryLight : "rgba(255,255,255,0.02)",
            color: stage === s ? C.secondary : C.textLight,
            fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <StageIcon stage={s} size={14} color={stage === s ? C.secondary : C.textLight} />
            {stageNames[s]}
          </motion.button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        {[1, 2].map((l) => (
          <motion.button key={l} onClick={() => setLevel(l)} {...makeTap(reduceMotion)} style={{
            padding: "6px 14px", borderRadius: 20, border: `2px solid ${level === l ? C.primary : C.border}`,
            background: level === l ? C.primaryLight : "rgba(255,255,255,0.02)",
            color: level === l ? C.primary : C.textLight, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            {l === 1 ? (lang === "te" ? "లెవెల్-1" : "Level-1") : (lang === "te" ? "లెవెల్-2" : "Level-2")}
          </motion.button>
        ))}
        <span style={{ fontSize: 12, color: C.secondary }}>
          {level === 1
            ? (lang === "te" ? `లెవెల్-1: మొదటి ${clampLevel1Target(level1Target)} కార్యకలాపాలు` : `Level-1: first ${clampLevel1Target(level1Target)} actions`)
            : (lang === "te" ? `లెవెల్-2: ఇంకా ${LEVEL_CONFIG.level2Additional} కార్యకలాపాలు` : `Level-2: +${LEVEL_CONFIG.level2Additional} actions`)}
        </span>
      </div>

      <motion.div style={{ ...CARD_STYLE, borderRadius: 20, padding: 32, textAlign: "center" }}>
        <MediaThumb item={activity} size={86} radius={24} fallback={getImitationFallbackVisual(activity, stage)} />
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>
          {lang === 'te' ? activity.telugu : activity.action}
        </div>
        <p style={{ fontSize: 14, color: C.textLight, lineHeight: 1.5, margin: "12px 0 24px" }}>
          {lang === 'te' ? 'మీరు ముందు చేయండి, జెస్సీని చూడనివ్వండి, తర్వాత కలిసి చేయండి' : 'You do it first, let Jessy watch, then do it together'}
        </p>
        <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textLight, fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: C.text }}>{lang === "te" ? "కేర్‌గివర్ స్క్రిప్ట్:" : "Caregiver script:"}</strong>{" "}
          {lang === "te" ? "నేను చేస్తాను, నువ్వు చూడి. ఇప్పుడు కలిసి చేద్దాం." : "I do, you watch. Now we do it together."}
        </div>
        <motion.button onClick={() => setWaitSeconds(3)} {...makeTap(reduceMotion)} style={{
          marginBottom: 14, padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.secondary}`,
          background: C.secondaryLight, color: C.text, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          {waitSeconds > 0
            ? (lang === "te" ? `వేచి ఉండండి: ${waitSeconds}s` : `Wait: ${waitSeconds}s`)
            : (lang === "te" ? "3 సెకన్లు ఆగి అవకాశం ఇవ్వండి" : "Pause 3 seconds and give response time")}
        </motion.button>
        <motion.button onClick={() => recordMetric?.("waits", 1, "imitation")} {...makeTap(reduceMotion)} style={{
          marginBottom: 14, marginLeft: 8, padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.secondary}`,
          background: "rgba(255,255,255,0.03)", color: C.text, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          {lang === "te" ? "వేచి చూసిన టర్న్ లాగ్" : "Log waiting turn"}
        </motion.button>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <motion.button onClick={markDone} {...makeTap(reduceMotion)} style={{
            padding: "14px 32px", borderRadius: 16, border: "none",
            background: C.success, color: "white", fontWeight: 800, fontSize: 16,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <Check size={17} />
            {lang === 'te' ? 'చేసింది!' : 'She did it!'}
          </motion.button>
          <motion.button onClick={() => setCurrentIdx((currentIdx + 1) % filtered.length)} {...makeTap(reduceMotion)} style={{
            padding: "14px 32px", borderRadius: 16, border: `2px solid ${C.border}`,
            background: "rgba(255,255,255,0.02)", color: C.textLight, fontWeight: 700, fontSize: 16,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <ArrowRight size={16} />
            {lang === 'te' ? 'దాటవేయి' : 'Skip'}
          </motion.button>
        </div>
      </motion.div>

      <div style={{ marginTop: 20, padding: 16, background: C.accentLight, borderRadius: 14, fontSize: 13, lineHeight: 1.6, color: C.text }}>
        <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Sparkles size={14} />{lang === 'te' ? 'చిట్కా:' : 'Tip:'}</strong>{' '}
        {stage === "body" && (lang === 'te' ? 'శరీర అనుకరణ అనేది మాట అనుకరణకి మొదటి మెట్టు. ఇది సరదాగా ఉంచండి!' : 'Body imitation is the first step to speech imitation. Keep it playful!')}
        {stage === "mouth" && (lang === 'te' ? 'నోటి కదలికలు మాట కోసం కండరాలను బలపరుస్తాయి. అద్దం ముందు అభ్యసించండి!' : 'Mouth movements build muscles for speech. Practice in front of a mirror!')}
        {stage === "sound" && (lang === 'te' ? 'ఈ శబ్దాలు పదాలకు మూలాలు. ఆమె శబ్దం చేస్తే — ఎలాంటిదైనా — ప్రశంసించండి!' : 'These sounds are building blocks for words. If she makes ANY sound — celebrate!')}
      </div>
      <div style={{ marginTop: 8 }}>
        <motion.button onClick={() => recordMetric?.("frustrationEpisodes", 1, "imitation")} {...makeTap(reduceMotion)} style={{
          width: "100%", minHeight: 42, borderRadius: 12, border: `1px solid ${C.danger}`,
          background: "rgba(255,131,165,0.14)", color: C.text, fontWeight: 700, cursor: "pointer",
        }}>
          {lang === "te" ? "నిరాశ ఎపిసోడ్ లాగ్" : "Log frustration episode"}
        </motion.button>
      </div>
    </motion.div>
  );
}
