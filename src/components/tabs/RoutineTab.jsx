import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ListChecks, Mic, Music2, Users, Circle, CheckCircle2 } from "lucide-react";
import { C, CARD_STYLE, DAILY_ROUTINE_STEPS } from "../../data/constants";
import { makeFadeUp, makeTap } from "../shared";
import { Sparkles } from "lucide-react";

export default function RoutineTab({ lang, onComplete, recordMetric }) {
  const reduceMotion = useReducedMotion();
  const [checked, setChecked] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const totalSteps = DAILY_ROUTINE_STEPS.length;
  const allDone = checked.size === totalSteps;
  const toggle = (i) => {
    const n = new Set(checked);
    if (n.has(i)) n.delete(i); else n.add(i);
    setChecked(n);
  };

  useEffect(() => {
    if (!allDone && submitted) setSubmitted(false);
  }, [allDone, submitted]);

  const routineIcon = [ListChecks, Mic, Music2, Users];

  return (
    <motion.div {...makeFadeUp(reduceMotion)}>
      <div style={{
        background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
        borderRadius: 20, padding: 24, marginBottom: 20, color: "white",
        boxShadow: "0 12px 32px rgba(18, 28, 58, 0.45)",
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          {lang === 'te' ? 'రోజువారీ 20-నిమిషాల దినచర్య' : 'Daily 20-Minute Routine'}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          {lang === 'te' ? 'జెస్సీ కోసం — తాతయ్య/అమ్మమ్మ అనుసరించవచ్చు' : 'For Jessy — Grandparents can follow this'}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 4 }}>
          {DAILY_ROUTINE_STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 3,
              background: checked.has(i) ? "white" : "rgba(255,255,255,0.3)",
              transition: "all 0.3s",
            }} />
          ))}
        </div>
      </div>

      {DAILY_ROUTINE_STEPS.map((step, i) => {
        const StepIcon = routineIcon[i] || Circle;
        return (
          <motion.button key={i} onClick={() => toggle(i)} {...makeTap(reduceMotion)} style={{
            display: "flex", alignItems: "center", gap: 16, width: "100%",
            ...CARD_STYLE,
            background: checked.has(i) ? C.secondaryLight : C.card,
            border: `2px solid ${checked.has(i) ? C.secondary : C.border}`,
            borderRadius: 16, padding: 16, marginBottom: 12, cursor: "pointer",
            textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: checked.has(i) ? C.secondary : C.primaryLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s",
            }}>
              {checked.has(i) ? <CheckCircle2 size={24} color="#043226" /> : <StepIcon size={22} color={checked.has(i) ? "#043226" : C.primary} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 2 }}>{step.time}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                {lang === 'te' ? step.titleTe : step.title}
              </div>
              <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                {lang === 'te' ? step.descTe : step.desc}
              </div>
            </div>
          </motion.button>
        );
      })}

      <div style={{ ...CARD_STYLE, borderRadius: 14, padding: 14, marginTop: 6, marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: C.textLight, marginBottom: 8 }}>
          {lang === "te" ? `స్టెప్స్ పూర్తి: ${checked.size}/${totalSteps}` : `Steps completed: ${checked.size}/${totalSteps}`}
        </div>
        <motion.button
          onClick={() => {
            if (!allDone || submitted) return;
            setSubmitted(true);
            recordMetric?.("routineCompletions", 1, "routine");
            recordMetric?.("functionalAttempts", 1, "routine");
            onComplete?.();
          }}
          disabled={!allDone || submitted}
          {...makeTap(reduceMotion)}
          style={{
            minHeight: 46, width: "100%", borderRadius: 12, border: "none",
            background: allDone && !submitted ? C.success : "rgba(255,255,255,0.08)",
            color: allDone && !submitted ? "#032821" : C.textLight,
            fontWeight: 800, cursor: allDone && !submitted ? "pointer" : "not-allowed",
            opacity: submitted ? 0.8 : 1,
          }}
        >
          {submitted
            ? (lang === "te" ? "రూటీన్ సమర్పించబడింది" : "Routine submitted")
            : (lang === "te" ? "రూటీన్ పూర్తయింది - Submit" : "Done with routine - Submit")}
        </motion.button>
      </div>

      <div style={{ marginTop: 8, padding: 16, background: C.accentLight, borderRadius: 14, fontSize: 13, lineHeight: 1.6, color: C.text }}>
        <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ListChecks size={14} />{lang === 'te' ? 'ఎప్పుడు:' : 'When:'}</strong>{' '}
        {lang === 'te'
          ? 'ప్రతి రోజు ఒకే సమయంలో చేయండి (ఉదా: ఉదయం 10 గంటలు). పిల్లలు రోజువారీ అలవాటుతో బాగా నేర్చుకుంటారు.'
          : 'Do it at the SAME time every day (e.g. 10 AM). Children learn best with daily routine.'}
      </div>
    </motion.div>
  );
}
