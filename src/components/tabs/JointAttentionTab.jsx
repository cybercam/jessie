import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { C, CARD_STYLE } from "../../data/constants";
import { makeFadeUp, makeTap } from "../shared";

export default function JointAttentionTab({ lang, recordMetric, onComplete }) {
  const reduceMotion = useReducedMotion();
  const [routineIdx, setRoutineIdx] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const routines = [
    { title: lang === "te" ? "బొమ్మపై కలిసి దృష్టి" : "Shared toy attention", prompt: lang === "te" ? "నేను చూస్తున్నాను... నువ్వూ చూడు" : "I look... you look", wait: lang === "te" ? "3-5 సెకన్లు నిశ్శబ్దంగా వేచి ఉండండి" : "Wait quietly for 3-5 seconds", reinforce: lang === "te" ? "చూసిన వెంటనే ప్రశంస + ఆట టర్న్" : "Praise and give a play turn immediately" },
    { title: lang === "te" ? "చూపించడం + పంచుకున్న ఆనందం" : "Pointing and shared enjoyment", prompt: lang === "te" ? "చూడూ! ఇది కారు" : "Look! This is a car", wait: lang === "te" ? "ఆమె చూపించే/చూడే వరకు వేచి ఉండండి" : "Wait for her to point or look", reinforce: lang === "te" ? "అదే పదం మళ్లీ చెప్పి హై-ఫైవ్" : "Model same word and high-five" },
    { title: lang === "te" ? "టర్న్-టేకింగ్ మైక్రో గేమ్" : "Turn-taking micro game", prompt: lang === "te" ? "నా టర్న్... నీ టర్న్" : "My turn... your turn", wait: lang === "te" ? "ఒక్క టర్న్ తర్వాత 3 సెకన్లు విరామం" : "Pause 3 seconds after each turn", reinforce: lang === "te" ? "టర్న్ వచ్చినప్పుడు వెంటనే రివార్డ్" : "Immediate reward when turn is taken" },
    { title: lang === "te" ? "కలిసి యాక్షన్ కాపీ ఆట" : "Shared action copy game", prompt: lang === "te" ? "నేను తట్టాను... నువ్వూ తట్టు" : "I tap... you tap", wait: lang === "te" ? "ఆమె చూస్తూ కాపీ చేసే అవకాశం ఇవ్వండి" : "Pause and wait for visual attention and imitation", reinforce: lang === "te" ? "కాపీ ప్రయత్నం వచ్చిన వెంటనే ప్రశంస" : "Praise immediately for any copy attempt" },
    { title: lang === "te" ? "చూపించడం + పేరుపెట్టడం" : "Point and label together", prompt: lang === "te" ? "చూడూ, బంతి! నువ్వు చూపు" : "Look, ball! You point too", wait: lang === "te" ? "చూపు/చూడే స్పందన కోసం 3 సెకన్లు ఆగండి" : "Wait 3 seconds for point/look response", reinforce: lang === "te" ? "ఆమె చూసినది వెంటనే పదంగా మోడల్ చేయండి" : "Model the word right after she looks/points" },
  ];
  const item = routines[routineIdx % routines.length];
  const goalCount = routines.length;
  const progressCount = Math.min(doneCount, goalCount);

  const markDone = () => {
    if (doneCount >= goalCount) return;
    const nextCount = doneCount + 1;
    setDoneCount(nextCount);
    recordMetric?.("functionalAttempts", 1, "jointAttention");
    recordMetric?.("jointAttentionBids", 1, "jointAttention");
    if (nextCount >= goalCount) onComplete?.();
    setRoutineIdx((prev) => (prev + 1) % routines.length);
  };

  return (
    <motion.div {...makeFadeUp(reduceMotion)}>
      <div style={{ ...CARD_STYLE, borderRadius: 18, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: C.textLight, fontSize: 12 }}>
          <span>{lang === "te" ? "పూర్తైన రౌండ్లు" : "Completed rounds"}: <strong style={{ color: C.text }}>{progressCount}/{goalCount}</strong></span>
          <span>{lang === "te" ? "లక్ష్యం: దృష్టి + టర్న్" : "Goal: joint attention + turns"}</span>
        </div>
      </div>
      <div style={{ ...CARD_STYLE, borderRadius: 20, padding: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 10 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: C.textLight, lineHeight: 1.7 }}>
          <div><strong style={{ color: C.text }}>{lang === "te" ? "ప్రాంప్ట్:" : "Prompt:"}</strong> {item.prompt}</div>
          <div><strong style={{ color: C.text }}>{lang === "te" ? "వేచి ఉండటం:" : "Wait cue:"}</strong> {item.wait}</div>
          <div><strong style={{ color: C.text }}>{lang === "te" ? "రిఫోర్స్:" : "Reinforcement:"}</strong> {item.reinforce}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <motion.button onClick={markDone} {...makeTap(reduceMotion)} style={{
            minHeight: 42, padding: "8px 12px", borderRadius: 10, border: "none", background: C.success, color: "#032821",
            fontWeight: 800, cursor: doneCount >= goalCount ? "not-allowed" : "pointer", opacity: doneCount >= goalCount ? 0.7 : 1,
          }}>
            {doneCount >= goalCount ? (lang === "te" ? "ఈరోజు జాయింట్ పూర్తి" : "Joint done for today") : (lang === "te" ? "బిడ్ వచ్చిందీ!" : "Got a bid!")}
          </motion.button>
          <motion.button onClick={() => recordMetric?.("sharedEngagementMinutes", 1, "jointAttention")} {...makeTap(reduceMotion)} style={{
            minHeight: 42, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.secondary}`, background: C.secondaryLight,
            color: C.text, fontWeight: 700, cursor: "pointer",
          }}>
            {lang === "te" ? "+1 నిమిషం షేర్డ్ ఎంగేజ్‌మెంట్" : "+1 min shared engagement"}
          </motion.button>
          <motion.button onClick={() => recordMetric?.("unengagedMoments", 1, "jointAttention")} {...makeTap(reduceMotion)} style={{
            minHeight: 42, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)",
            color: C.textLight, fontWeight: 700, cursor: "pointer",
          }}>
            {lang === "te" ? "అన్‌ఎంగేజ్‌డ్ మోమెంట్" : "Unengaged moment"}
          </motion.button>
          <motion.button onClick={() => recordMetric?.("frustrationEpisodes", 1, "jointAttention")} {...makeTap(reduceMotion)} style={{
            minHeight: 42, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.danger}`, background: "rgba(255,131,165,0.14)",
            color: C.text, fontWeight: 700, cursor: "pointer",
          }}>
            {lang === "te" ? "నిరాశ లాగ్" : "Log frustration"}
          </motion.button>
        </div>
        <div style={{ marginTop: 12, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)" }}>
          <a href="https://www.hanen.org/Helpful-Info/Articles/Joint-Attention-What-It-Is-and-Why-It-Matters.aspx" target="_blank" rel="noreferrer" style={{ color: C.secondary, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            {lang === "te" ? "తల్లిదండ్రుల కోసం: Joint Attention ఎందుకు ముఖ్యం?" : "For parents: What is joint attention and why it matters?"}
          </a>
        </div>
      </div>
    </motion.div>
  );
}
