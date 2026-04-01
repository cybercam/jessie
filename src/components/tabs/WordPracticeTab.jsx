import { useState, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { C, CARD_STYLE, WORD_CATEGORIES, PRACTICE_MODES, LEVEL_CONFIG } from "../../data/constants";
import { CORE_WORDS_EXPANDED } from "../../data/words";
import { buildCountPool, clampLevel1Target, todayKey } from "../../utils/helpers";
import { makeFadeUp, makeTap, getWordIcon, MediaThumb, SpeechSynthButton, StarRating, ProgressRing, caregiverModelLine } from "../shared";

export default function WordPracticeTab({
  lang, onComplete, askTip, wordStats, setWordStats,
  level1Target, communicationMode, recordMetric,
}) {
  const reduceMotion = useReducedMotion();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [practiced, setPracticed] = useState(new Set());
  const [showSyllables, setShowSyllables] = useState(false);
  const [rating, setRating] = useState(0);
  const [level, setLevel] = useState(1);
  const [category, setCategory] = useState("all");
  const [mode, setMode] = useState("sequence");
  const [aiTip, setAiTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);
  const [childChoice, setChildChoice] = useState("play");
  const [aacTapped, setAacTapped] = useState(false);
  const difficultSet = new Set(wordStats?.difficultWords || []);
  const categoryPool = CORE_WORDS_EXPANDED.filter((w) => category === "all" || w.category === category);
  const leveledPool = buildCountPool(categoryPool, level, level1Target);
  const difficultPool = leveledPool.filter((w) => difficultSet.has(w.word));
  const activePool = mode === "difficult" ? (difficultPool.length > 0 ? difficultPool : leveledPool) : leveledPool;
  const safePool = activePool.length > 0 ? activePool : buildCountPool(CORE_WORDS_EXPANDED, level, level1Target);
  const word = safePool[currentIdx % safePool.length];
  const WordIcon = getWordIcon(word.word);
  const hasDifficult = (wordStats?.difficultWords?.length || 0) > 0;

  useEffect(() => {
    setCurrentIdx(0); setRating(0); setAiTip(""); setShowSyllables(false); setAacTapped(false);
  }, [level, category, mode, level1Target]);

  const getAiTip = async (w) => {
    setLoadingTip(true);
    const tip = await askTip(w, lang, currentIdx);
    setAiTip(tip);
    setLoadingTip(false);
  };

  const next = () => {
    if (rating > 0) {
      const newP = new Set(practiced);
      newP.add(word.word);
      setPracticed(newP);
      if (newP.size >= 5) onComplete?.();
      recordMetric?.("functionalAttempts", 1, "words");
      if (rating >= 3) recordMetric?.("spontaneousRequests", 1, "words");
      const today = todayKey();
      const prev = wordStats?.day === today ? wordStats : { day: today, practicedToday: [], difficultWords: [], totalRatings: 0 };
      const practicedToday = Array.from(new Set([...prev.practicedToday, word.word]));
      const difficultWords = rating <= 2
        ? Array.from(new Set([...prev.difficultWords, word.word])).slice(-25)
        : prev.difficultWords.filter((wName) => wName !== word.word);
      setWordStats({ ...prev, practicedToday, difficultWords, totalRatings: (prev.totalRatings || 0) + 1 });
    }
    setRating(0); setAiTip(""); setShowSyllables(false); setAacTapped(false);
    if (mode === "random") {
      setCurrentIdx(Math.floor(Math.random() * safePool.length));
    } else {
      setCurrentIdx((currentIdx + 1) % safePool.length);
    }
  };

  const choiceOptions = [
    { id: "play", en: "Play turn", te: "ఆట టర్న్" },
    { id: "snack", en: "Snack", te: "స్నాక్" },
    { id: "hug", en: "Hug/high-five", te: "హగ్/హై-ఫైవ్" },
  ];
  const aacStrip = ["I want", "more", "help", "all done"];

  return (
    <motion.div {...makeFadeUp(reduceMotion)}>
      <div style={{ ...CARD_STYLE, borderRadius: 14, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: C.textLight, fontSize: 12, marginBottom: 8 }}>
          <span>{lang === "te" ? "ఈ రోజు అభ్యాసం" : "Today practiced"}: <strong style={{ color: C.text }}>{wordStats?.practicedToday?.length || 0}</strong></span>
          <span>{lang === "te" ? "కష్టం పదాలు" : "Difficult words"}: <strong style={{ color: C.text }}>{wordStats?.difficultWords?.length || 0}</strong></span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRACTICE_MODES.map((m) => (
            <motion.button key={m} onClick={() => setMode(m)} {...makeTap(reduceMotion)} style={{
              padding: "6px 10px", borderRadius: 12,
              border: `1px solid ${mode === m ? C.secondary : C.border}`,
              background: mode === m ? C.secondaryLight : "rgba(255,255,255,0.02)",
              color: mode === m ? C.secondary : C.textLight, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              {m === "sequence" && (lang === "te" ? "క్రమం" : "Sequence")}
              {m === "random" && (lang === "te" ? "రాండమ్" : "Random")}
              {m === "difficult" && (lang === "te" ? "కష్టం" : "Difficult")}
            </motion.button>
          ))}
        </div>
        {hasDifficult && mode !== "difficult" && (
          <motion.button onClick={() => setMode("difficult")} {...makeTap(reduceMotion)} style={{
            marginTop: 8, padding: "8px 12px", borderRadius: 12, border: `1px solid ${C.accent}`,
            background: C.accentLight, color: C.text, fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            {lang === "te" ? "ఈ రోజు కష్టం పదాలు పునశ్చరణ చేయండి" : "Review difficult words first today"}
          </motion.button>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ProgressRing value={practiced.size} max={5} color={C.primary} />
          <span style={{ fontSize: 12, color: C.textLight }}>{lang === 'te' ? 'లక్ష్యం: 5 పదాలు' : 'Goal: 5 words'}</span>
          <span style={{ fontSize: 12, color: C.secondary }}>
            {level === 1
              ? (lang === "te" ? `లెవెల్-1: మొదటి ${clampLevel1Target(level1Target)} పదాలు` : `Level-1: first ${clampLevel1Target(level1Target)} words`)
              : (lang === "te" ? `లెవెల్-2: ఇంకా ${LEVEL_CONFIG.level2Additional} పదాలు` : `Level-2: +${LEVEL_CONFIG.level2Additional} words`)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{
            padding: "6px 10px", borderRadius: 12, border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.04)", color: C.text, fontSize: 12,
          }}>
            {WORD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat === "all" ? (lang === "te" ? "అన్నీ" : "All") : cat}</option>
            ))}
          </select>
          {[1, 2].map(l => (
            <motion.button key={l} onClick={() => { setLevel(l); setCurrentIdx(0); }} {...makeTap(reduceMotion)} style={{
              padding: "6px 14px", borderRadius: 20, border: `2px solid ${level === l ? C.primary : C.border}`,
              background: level === l ? C.primaryLight : "rgba(255,255,255,0.02)", color: level === l ? C.primary : C.textLight,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              {l === 1 ? (lang === "te" ? "లెవెల్-1" : "Level-1") : (lang === "te" ? "లెవెల్-2" : "Level-2")}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div style={{ ...CARD_STYLE, borderRadius: 20, padding: 32, textAlign: "center" }}>
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", textAlign: "left" }}>
          <div style={{ fontSize: 12, color: C.textLight, marginBottom: 8 }}>
            {lang === "te" ? "ఈ రౌండ్ కోసం జెస్సీ ఎంపిక (PRT child choice):" : "Jessy choice for this round (PRT child choice):"}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {choiceOptions.map((opt) => (
              <motion.button key={opt.id} onClick={() => setChildChoice(opt.id)} {...makeTap(reduceMotion)} style={{
                minHeight: 40, padding: "6px 10px", borderRadius: 10,
                border: `1px solid ${childChoice === opt.id ? C.secondary : C.border}`,
                background: childChoice === opt.id ? C.secondaryLight : "rgba(255,255,255,0.02)",
                color: childChoice === opt.id ? C.secondary : C.textLight, fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>
                {lang === "te" ? opt.te : opt.en}
              </motion.button>
            ))}
          </div>
        </div>
        <MediaThumb item={word} size={78} radius={20} fallback={<WordIcon size={44} color={C.secondary} strokeWidth={2.1} />} />
        <div style={{ fontSize: 32, fontWeight: 800, color: C.text, fontFamily: "'Nunito', sans-serif" }}>{word.word}</div>
        <div style={{ fontSize: 22, color: C.primary, fontWeight: 600, margin: "4px 0 16px" }}>{word.telugu}</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <SpeechSynthButton text={word.word} lang="en" size="lg" />
          <SpeechSynthButton text={word.telugu} lang="te" size="lg" />
        </div>
        {communicationMode !== "speech-only" && (
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", textAlign: "left" }}>
            <div style={{ fontSize: 12, color: C.textLight, marginBottom: 8 }}>
              {communicationMode === "aac-first"
                ? (lang === "te" ? "ముందు AAC ట్యాప్ చేయండి, తర్వాత పదం మోడల్ చేయండి." : "Tap AAC first, then model the spoken word.")
                : (lang === "te" ? "AAC + మాట కలిపి మోడల్ చేయండి." : "Model AAC and speech together.")}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {aacStrip.map((token) => (
                <motion.button key={token} onClick={() => { setAacTapped(true); recordMetric?.("aacMessages", 1, "words"); }} {...makeTap(reduceMotion)} style={{
                  minHeight: 40, padding: "6px 10px", borderRadius: 10, border: `1px solid ${C.primary}`,
                  background: C.primaryLight, color: C.text, fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {token}
                </motion.button>
              ))}
              <motion.button onClick={() => { setAacTapped(true); recordMetric?.("aacMessages", 1, "words"); }} {...makeTap(reduceMotion)} style={{
                minHeight: 40, padding: "6px 12px", borderRadius: 10, border: `1px solid ${C.secondary}`,
                background: C.secondaryLight, color: C.text, fontSize: 12, fontWeight: 800, cursor: "pointer",
              }}>
                {lang === "te" ? `ట్యాప్: ${word.telugu}` : `Tap: ${word.word}`}
              </motion.button>
            </div>
            {aacTapped && (
              <div style={{ marginTop: 8, fontSize: 12, color: C.secondary }}>
                {lang === "te" ? "అద్భుతం - వెంటనే సహజమైన రివార్డ్ ఇవ్వండి." : "Great - give immediate natural reinforcement now."}
              </div>
            )}
          </div>
        )}

        <motion.button onClick={() => setShowSyllables(!showSyllables)} {...makeTap(reduceMotion)} style={{
          padding: "8px 20px", borderRadius: 20, border: `2px solid ${C.secondary}`,
          background: showSyllables ? C.secondaryLight : "rgba(255,255,255,0.02)", color: C.secondary,
          fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 12,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {showSyllables ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showSyllables ? (lang === 'te' ? 'అక్షరాలు దాచు' : 'Hide Syllables') : (lang === 'te' ? 'అక్షరాలు చూపు' : 'Show Syllables')}
          </span>
        </motion.button>

        <AnimatePresence>
          {showSyllables && (
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.24 }}
              style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}
            >
              {word.syllables.map((s, i) => (
                <span key={i} style={{
                  background: C.accentLight, padding: "8px 18px", borderRadius: 12,
                  fontSize: 22, fontWeight: 700, color: C.text, border: `2px solid ${C.accent}`,
                }}>{s}</span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 14, color: C.textLight, marginBottom: 8 }}>
            {lang === 'te' ? 'జెస్సీ ఎంత బాగా చెప్పింది?' : 'How well did Jessy say it?'}
          </p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textLight, fontSize: 13, lineHeight: 1.55, textAlign: "left" }}>
          <strong style={{ color: C.text }}>{lang === "te" ? "కేర్‌గివర్ స్క్రిప్ట్:" : "Caregiver script:"}</strong>{" "}
          {caregiverModelLine(word.word, lang)}
          <div style={{ marginTop: 6 }}>
            {lang === "te"
              ? `సహజ రివార్డ్: ఆమె చెప్పగానే "${choiceOptions.find((c) => c.id === childChoice)?.te || "ఆట టర్న్"}" వెంటనే ఇవ్వండి.`
              : `Natural reinforcement: as soon as she attempts it, give "${choiceOptions.find((c) => c.id === childChoice)?.en || "play turn"}" immediately.`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
          <motion.button onClick={() => recordMetric?.("waits", 1, "words")} {...makeTap(reduceMotion)} style={{
            minHeight: 42, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.secondary}`,
            background: C.secondaryLight, color: C.text, fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            {lang === "te" ? "5 సెకన్లు వేచి చూసాం" : "Logged 5-second wait"}
          </motion.button>
          <motion.button onClick={() => recordMetric?.("frustrationEpisodes", 1, "words")} {...makeTap(reduceMotion)} style={{
            minHeight: 42, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.danger}`,
            background: "rgba(255,131,165,0.16)", color: C.text, fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            {lang === "te" ? "నిరాశ ఎపిసోడ్ లాగ్" : "Log frustration episode"}
          </motion.button>
        </div>

        <motion.button onClick={() => getAiTip(word)} disabled={loadingTip} {...makeTap(reduceMotion)} style={{
          marginTop: 16, padding: "10px 24px", borderRadius: 20,
          background: `linear-gradient(135deg, ${C.purple}, ${C.secondary})`,
          color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer",
          opacity: loadingTip ? 0.7 : 1,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Bot size={16} /> {loadingTip ? "..." : (lang === 'te' ? 'AI చిట్కా పొందు' : 'Get AI Tip')}
          </span>
        </motion.button>

        {aiTip && (
          <div style={{
            marginTop: 16, padding: 16, background: C.purpleLight, borderRadius: 14,
            fontSize: 14, lineHeight: 1.6, color: C.text, textAlign: "left",
            border: `1px solid ${C.purple}30`,
          }}>
            <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}><Bot size={14} /> AI Tip:</span> {aiTip}
          </div>
        )}
      </motion.div>

      <motion.button onClick={next} {...makeTap(reduceMotion)} style={{
        marginTop: 20, width: "100%", padding: "16px", borderRadius: 16,
        background: rating > 0 ? C.primary : C.border, color: rating > 0 ? "white" : C.textLight,
        border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer", transition: "all 0.2s",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {lang === 'te' ? 'తర్వాత పదం' : 'Next Word'} <ArrowRight size={18} />
        </span>
      </motion.button>
    </motion.div>
  );
}
