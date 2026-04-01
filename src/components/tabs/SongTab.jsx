import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp, Music2, Sparkles } from "lucide-react";
import { C, CARD_STYLE, LEVEL_CONFIG } from "../../data/constants";
import { SONGS_AND_RHYMES } from "../../data/words";
import { buildCountPool, clampLevel1Target } from "../../utils/helpers";
import { makeFadeUp, makeTap, MediaThumb } from "../shared";

export default function SongTab({ lang, level1Target, recordMetric, onComplete }) {
  const reduceMotion = useReducedMotion();
  const [level, setLevel] = useState(1);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completedSongs, setCompletedSongs] = useState(new Set());
  const songPool = buildCountPool(SONGS_AND_RHYMES, level, level1Target);
  const safeSongPool = songPool.length > 0 ? songPool : SONGS_AND_RHYMES;
  const song = safeSongPool[current % safeSongPool.length];

  useEffect(() => { setCurrent(0); setRevealed(false); setCompletedSongs(new Set()); }, [level, level1Target]);

  const next = () => {
    if (revealed) {
      recordMetric?.("functionalAttempts", 1, "songs");
      recordMetric?.("spontaneousRequests", 1, "songs");
      const nextCompleted = new Set(completedSongs);
      nextCompleted.add(song.title);
      setCompletedSongs(nextCompleted);
      if (nextCompleted.size >= 3) onComplete?.();
    }
    setRevealed(false);
    setCurrent((current + 1) % safeSongPool.length);
  };

  return (
    <motion.div {...makeFadeUp(reduceMotion)}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
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
            ? (lang === "te" ? `లెవెల్-1: మొదటి ${clampLevel1Target(level1Target)} పాటలు` : `Level-1: first ${clampLevel1Target(level1Target)} songs`)
            : (lang === "te" ? `లెవెల్-2: ఇంకా ${LEVEL_CONFIG.level2Additional} పాటలు` : `Level-2: +${LEVEL_CONFIG.level2Additional} songs`)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {safeSongPool.map((s, i) => (
          <motion.button key={i} onClick={() => { setCurrent(i); setRevealed(false); }} {...makeTap(reduceMotion)} style={{
            padding: "6px 12px", borderRadius: 12,
            border: `2px solid ${current === i ? C.accent : C.border}`,
            background: current === i ? C.accentLight : "rgba(255,255,255,0.02)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            color: current === i ? C.text : C.textLight, display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <Music2 size={13} /> {s.title}
          </motion.button>
        ))}
      </div>

      <motion.div style={{ ...CARD_STYLE, borderRadius: 20, padding: 32, textAlign: "center" }}>
        <MediaThumb item={song} size={74} radius={20} fallback={<Music2 size={40} color={C.accent} />} />
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 24, lineHeight: 1.5 }}>
          {song.line.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span onClick={() => setRevealed(true)} style={{
                  display: "inline-block", minWidth: 80, padding: "4px 12px",
                  background: revealed ? C.accentLight : C.primaryLight,
                  borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 24,
                  color: revealed ? C.primary : "transparent",
                  border: `2px dashed ${revealed ? C.primary : C.danger}`,
                  transition: "all 0.3s",
                  textShadow: revealed ? "none" : `0 0 12px ${C.primary}`,
                }}>
                  {revealed ? song.answer : "???"}
                </span>
              )}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 14, color: C.textLight, marginBottom: 20, lineHeight: 1.6 }}>
          {lang === 'te'
            ? 'పాడండి, ఖాళీ వద్ద ఆపండి, జెస్సీ కోసం వేచి ఉండండి. ఆమె ఏదైనా శబ్దం చేస్తే ప్రశంసించండి.'
            : 'Sing it, pause at the blank, and wait for Jessy. If she makes any sound, praise her.'}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <motion.button onClick={() => recordMetric?.("waits", 1, "songs")} {...makeTap(reduceMotion)} style={{
            minHeight: 40, borderRadius: 10, border: `1px solid ${C.secondary}`, background: C.secondaryLight,
            color: C.text, fontWeight: 700, fontSize: 12, padding: "8px 12px", cursor: "pointer",
          }}>
            {lang === "te" ? "పాజ్-వెయిట్ సక్సెస్" : "Pause-wait success"}
          </motion.button>
          <motion.button onClick={() => recordMetric?.("frustrationEpisodes", 1, "songs")} {...makeTap(reduceMotion)} style={{
            minHeight: 40, borderRadius: 10, border: `1px solid ${C.danger}`, background: "rgba(255,131,165,0.14)",
            color: C.text, fontWeight: 700, fontSize: 12, padding: "8px 12px", cursor: "pointer",
          }}>
            {lang === "te" ? "నిరాశ లాగ్" : "Log frustration"}
          </motion.button>
        </div>

        <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textLight, fontSize: 13, lineHeight: 1.55, textAlign: "left" }}>
          <strong style={{ color: C.text }}>{lang === "te" ? "కేర్‌గివర్ స్క్రిప్ట్:" : "Caregiver script:"}</strong>{" "}
          {lang === "te"
            ? `నేను పాడుతాను: "${song.line.replace("___", "___")}". నువ్వు చెప్పిన శబ్దం ఏదైనా బాగుంది.`
            : `I sing: "${song.line}". Any sound you try is a great try.`}
        </div>

        <motion.button onClick={() => setRevealed(!revealed)} {...makeTap(reduceMotion)} style={{
          padding: "12px 28px", borderRadius: 14, border: "none",
          background: revealed ? C.textLight : C.primary, color: "white",
          fontWeight: 700, fontSize: 15, cursor: "pointer", marginRight: 12, display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          {revealed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {revealed ? (lang === 'te' ? 'దాచు' : 'Hide') : (lang === 'te' ? 'జవాబు చూపు' : 'Show Answer')}
        </motion.button>
        <motion.button onClick={next} {...makeTap(reduceMotion)} style={{
          padding: "12px 28px", borderRadius: 14, border: `2px solid ${C.primary}`,
          background: "rgba(255,255,255,0.02)", color: C.primary, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <ArrowRight size={17} /> {lang === 'te' ? 'తర్వాత' : 'Next'}
        </motion.button>
      </motion.div>

      <div style={{ marginTop: 20, padding: 16, background: C.secondaryLight, borderRadius: 14, fontSize: 13, lineHeight: 1.6, color: C.text }}>
        <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Sparkles size={14} />{lang === 'te' ? 'ఎలా పని చేస్తుంది:' : 'How this works:'}</strong>{' '}
        {lang === 'te'
          ? 'పునరావృత పాటలు మోటార్ మెమరీని నిర్మిస్తాయి. ఒకే పాటను ప్రతి రోజు పాడండి. ఆమెను బలవంతం చేయవద్దు — ఆమె తన సమయం వచ్చినప్పుడు పూరిస్తుంది!'
          : 'Repetitive songs build motor memory. Sing the SAME song daily. Don\'t force her — she\'ll fill in when she\'s ready!'}
      </div>
    </motion.div>
  );
}
