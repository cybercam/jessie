import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import GameShell from "./GameShell";
import SyllableBubble from "./SyllableBubble";
import { measureBubble } from "./pretextLayout";

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export default function SyllablePopTab({ lang, words, theme }) {
  const reduceMotion = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);
  const [targetWord, setTargetWord] = useState(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [rounds, setRounds] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const nextBubbleId = useRef(1);
  const spawnTimer = useRef(null);
  const tickTimer = useRef(null);
  const targetWordRef = useRef(targetWord);
  const targetIndexRef = useRef(targetIndex);

  useEffect(() => {
    targetWordRef.current = targetWord;
  }, [targetWord]);

  useEffect(() => {
    targetIndexRef.current = targetIndex;
  }, [targetIndex]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const candidateWords = useMemo(
    () => words.filter((w) => Array.isArray(w.syllables) && w.syllables.length >= 2),
    [words]
  );
  const syllablePool = useMemo(
    () => Array.from(new Set(candidateWords.flatMap((w) => w.syllables).filter(Boolean))),
    [candidateWords]
  );

  const gameHeight = viewportWidth < 480 ? 300 : viewportWidth < 900 ? 340 : 380;
  const spawnEveryMs = viewportWidth < 480 ? 1200 : 1000;

  const progress = targetWord ? targetIndex / targetWord.syllables.length : 0;

  const resetRound = (full = false) => {
    const newWord = randomOf(candidateWords);
    setTargetWord(newWord);
    setTargetIndex(0);
    setBubbles([]);
    if (full) {
      setScore(0);
      setLives(3);
      setTimeLeft(45);
      setRounds(0);
    }
  };

  const stopGame = () => {
    setRunning(false);
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
  };

  const startGame = () => {
    resetRound(true);
    setRunning(true);
  };

  const spawnBubble = () => {
    const currentWord = targetWordRef.current;
    if (!currentWord || !running) return;
    const expected = currentWord.syllables[targetIndexRef.current];
    const distractors = syllablePool.filter((s) => s !== expected);
    const choices = [expected, randomOf(distractors), randomOf(distractors)].filter(Boolean);
    const pick = randomOf(choices);
    const isTarget = pick === expected;
    let measured;
    try {
      measured = measureBubble(pick, {
        font: "700 20px Nunito",
        lineHeight: 24,
        maxWidth: viewportWidth < 480 ? 160 : 210,
        minWidth: 56,
        minHeight: 44,
        paddingX: 18,
        paddingY: 12,
      });
    } catch {
      measured = { width: 84, height: 48 };
    }

    const bubble = {
      id: nextBubbleId.current++,
      text: pick,
      isTarget,
      x: 10 + Math.random() * 80,
      width: measured.width,
      height: measured.height,
      endY: gameHeight + measured.height,
      duration: reduceMotion ? 0.9 : 3 + Math.random() * 1.2,
      fontSize: viewportWidth < 480 ? 18 : 20,
    };
    setBubbles((prev) => [...prev.slice(-8), bubble]);
  };

  const onBubbleTap = (bubble) => {
    if (!running || !targetWord) return;
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    const expected = targetWord.syllables[targetIndexRef.current];
    if (bubble.text === expected) {
      setScore((s) => s + 10);
      setTargetIndex((prev) => {
        const next = prev + 1;
        if (next >= targetWord.syllables.length) {
          setRounds((r) => r + 1);
          setTimeout(() => resetRound(false), 250);
          return 0;
        }
        return next;
      });
      return;
    }
    setLives((l) => Math.max(0, l - 1));
  };

  const onBubbleExit = (bubble) => {
    if (!running) return;
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    if (bubble.isTarget) setLives((l) => Math.max(0, l - 1));
  };

  useEffect(() => {
    if (!running || !targetWord) return;
    spawnTimer.current = setInterval(spawnBubble, spawnEveryMs);
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [running, targetWord, spawnEveryMs]);

  useEffect(() => {
    if (!running) return;
    tickTimer.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, [running]);

  useEffect(() => {
    if (running && (lives <= 0 || timeLeft <= 0)) stopGame();
  }, [running, lives, timeLeft]);

  return (
    <GameShell
      lang={lang}
      theme={theme}
      title={lang === "te" ? "సిలబుల్ పాప్" : "Syllable Pop"}
      subtitle={
        targetWord
          ? `${lang === "te" ? "పదం" : "Word"}: ${targetWord.word} (${targetWord.syllables.join("-")})`
          : lang === "te"
          ? "ప్రారంభం నొక్కండి"
          : "Press start"
      }
      score={score}
      lives={lives}
      progress={progress}
      timeLeft={timeLeft}
      running={running}
      onStart={startGame}
      onRestart={startGame}
    >
      <div
        style={{
          position: "relative",
          height: gameHeight,
          borderRadius: 16,
          border: `1px dashed ${theme.border}`,
          background: "rgba(255,255,255,0.03)",
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <AnimatePresence>
          {bubbles.map((bubble) => (
            <SyllableBubble
              key={bubble.id}
              bubble={bubble}
              theme={theme}
              reduceMotion={reduceMotion}
              onTap={onBubbleTap}
              onExit={onBubbleExit}
            />
          ))}
        </AnimatePresence>
        {running && bubbles.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: theme.textLight, fontSize: 13 }}>
            {lang === "te" ? "బబుల్స్ లోడింగ్..." : "Loading bubbles..."}
          </div>
        )}
      </div>

      {!running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: theme.textLight, fontSize: 13, lineHeight: 1.6 }}
        >
          {timeLeft <= 0 || lives <= 0 ? (
            <div>
              <strong style={{ color: theme.text }}>{lang === "te" ? "రౌండ్ ముగిసింది." : "Round complete."}</strong>{" "}
              {lang === "te"
                ? `స్కోర్ ${score}, పూర్తైన పదాలు ${rounds}.`
                : `Score ${score}, words completed ${rounds}.`}
            </div>
          ) : (
            <div>
              {lang === "te"
                ? "సరిగ్గా వచ్చే సిలబుల్ బబుల్ పై ట్యాప్ చేయండి. తప్పు ట్యాప్ లేదా మిస్ అయితే లైఫ్ తగ్గుతుంది."
                : "Tap the next correct syllable bubble. Wrong taps or missed targets cost a life."}
            </div>
          )}
        </motion.div>
      )}
    </GameShell>
  );
}
