import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { C, CARD_STYLE } from "../../data/constants";
import { makeFadeUp, makeTap } from "../shared";

export default function CaregiverFeedbackTab({ lang }) {
  const reduceMotion = useReducedMotion();
  const [clipName, setClipName] = useState("");
  const [checks, setChecks] = useState({ modeled: false, waited: false, turnTaking: false });
  const [feedback, setFeedback] = useState("");
  const score = Object.values(checks).filter(Boolean).length;

  const generateFeedback = () => {
    const strengths = [];
    if (checks.modeled) strengths.push(lang === "te" ? "మోడలింగ్ సూపర్" : "Strong modeling");
    if (checks.waited) strengths.push(lang === "te" ? "వేచి ఉండటం బాగుంది" : "Good wait time");
    if (checks.turnTaking) strengths.push(lang === "te" ? "టర్న్-టేకింగ్ చేసింది" : "Turn-taking included");
    const nextStep = !checks.waited
      ? (lang === "te" ? "తర్వాత రౌండ్‌లో ప్రతి ప్రాంప్ట్ తర్వాత 5 సెకన్లు వేచి ఉండండి." : "Next round: wait 5 seconds after each prompt.")
      : !checks.turnTaking
      ? (lang === "te" ? "తర్వాత 'నా టర్న్-నీ టర్న్' స్క్రిప్ట్ జోడించండి." : "Next round: add a my-turn/your-turn script.")
      : (lang === "te" ? "ఇలాగే కొనసాగిస్తూ ఒక కొత్త పదాన్ని జోడించండి." : "Keep the same routine and add one new target word.");
    setFeedback(`${strengths.join(", ") || (lang === "te" ? "ప్రయత్నం చాలా బాగుంది" : "Great effort")}. ${nextStep}`);
  };

  return (
    <motion.div {...makeFadeUp(reduceMotion)}>
      <div style={{ ...CARD_STYLE, borderRadius: 20, padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          {lang === "te" ? "కేర్‌గివర్ వీడియో ఫీడ్‌బ్యాక్" : "Caregiver video feedback"}
        </div>
        <div style={{ fontSize: 13, color: C.textLight, marginBottom: 12 }}>
          {lang === "te" ? "2 నిమిషాల హోం ప్రాక్టీస్ క్లిప్ అప్లోడ్ చేసి చెక్లిస్ట్ స్కోర్ పొందండి." : "Upload a 2-minute home-practice clip and score with a quick checklist."}
        </div>
        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: C.textLight }}>{lang === "te" ? "ఐచ్చిక వీడియో అప్లోడ్" : "Optional video upload"}</span>
          <input type="file" accept="video/*" onChange={(e) => setClipName(e.target.files?.[0]?.name || "")} style={{ color: C.textLight }} />
          {clipName && <span style={{ fontSize: 12, color: C.secondary }}>{clipName}</span>}
        </label>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { id: "modeled", en: "I modeled target words 2-3 times", te: "నేను పదాలను 2-3 సార్లు మోడల్ చేశాను" },
            { id: "waited", en: "I waited 3-5 seconds after prompts", te: "ప్రాంప్ట్ తర్వాత 3-5 సెకన్లు ఆగాను" },
            { id: "turnTaking", en: "I used turn-taking language", te: "టర్న్-టేకింగ్ భాష ఉపయోగించాను" },
          ].map((item) => (
            <label key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", color: C.text }}>
              <input type="checkbox" checked={checks[item.id]} onChange={(e) => setChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))} />
              <span>{lang === "te" ? item.te : item.en}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.textLight }}>
          {lang === "te" ? "చెక్లిస్ట్ స్కోర్" : "Checklist score"}: <strong style={{ color: C.text }}>{score}/3</strong>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <motion.button onClick={generateFeedback} {...makeTap(reduceMotion)} style={{
            minHeight: 42, padding: "8px 12px", borderRadius: 10, border: "none", background: C.primary, color: "white", fontWeight: 800, cursor: "pointer",
          }}>
            {lang === "te" ? "ఫీడ్‌బ్యాక్ సృష్టించు" : "Generate feedback"}
          </motion.button>
          <div style={{ fontSize: 12, color: C.textLight, alignSelf: "center" }}>
            {lang === "te" ? "లో-బ్యాండ్‌విడ్త్ fallback: వీడియో లేకుండా చెక్లిస్ట్ మాత్రమే ఉపయోగించండి." : "Low-bandwidth fallback: use checklist only without video."}
          </div>
        </div>
        {feedback && (
          <div style={{ marginTop: 12, borderRadius: 12, padding: 12, background: C.secondaryLight, color: C.text, lineHeight: 1.6 }}>
            {feedback}
          </div>
        )}
      </div>
    </motion.div>
  );
}
