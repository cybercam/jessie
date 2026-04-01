import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getWordLabel, evaluateSpeechAttempt,
  GameWordButton, CommunicationGameShell, CaregiverAssistBar, useSpeechGameRound,
} from "./speechGameShared";

export default function MoreAgainGame({ lang, settings, onGameEvent, onSessionHint }) {
  const [reward, setReward] = useState({ active: false, reinforcer: settings.reinforcer });
  const targets = settings.targets?.length ? settings.targets : ["more", "again"];
  const roundState = useSpeechGameRound({ rounds: settings.loopRounds, onSessionHint, advanceThreshold: settings.advanceThreshold });
  const visibleTargets = targets.slice(0, settings.level >= 2 ? 2 : 1);
  const [effectOn, setEffectOn] = useState(true);

  useEffect(() => {
    setEffectOn(true);
    const timer = setTimeout(() => setEffectOn(false), 700);
    return () => clearTimeout(timer);
  }, [roundState.round]);

  const trigger = (responseType, selectedWord) => {
    const outcome = evaluateSpeechAttempt({
      responseMode: settings.responseMode, responseType, selectedWord, targets: visibleTargets,
      phraseTarget: settings.level >= 3 ? `${selectedWord} spin` : "", level: settings.level,
    });
    roundState.logAttempt(outcome);
    onGameEvent({ gameId: "moreAgain", responseType, target: selectedWord, reinforcer: settings.reinforcer, ...outcome });
    if (!outcome.attemptAccepted) return;
    setEffectOn(true);
    setReward({ active: true, reinforcer: settings.reinforcer });
    setTimeout(() => {
      setReward({ active: false, reinforcer: settings.reinforcer });
      setEffectOn(false);
      roundState.nextRound();
    }, 850);
  };

  return (
    <CommunicationGameShell
      lang={lang}
      title={lang === "te" ? "మోర్ / అగైన్" : "More / Again"}
      subtitle={lang === "te" ? "చిన్న ఫన్ ఎఫెక్ట్ తర్వాత మళ్లీ అడగాలి" : "Short effect, then request again"}
      gameIcon="🔁"
      round={roundState.round} rounds={settings.loopRounds}
      promptText={settings.voicePrompts ? (effectOn ? (lang === "te" ? "చూడు..." : "Watch...") : (lang === "te" ? "ఇప్పుడు అడుగు: మోర్/అగైన్" : "Now request: more/again")) : (effectOn ? "..." : (lang === "te" ? "ఇప్పుడు" : "Now"))}
      scene={
        <motion.div animate={{ rotate: effectOn ? 360 : 0 }} transition={{ duration: 0.8 }}>
          <span style={{ fontSize: 78 }} aria-hidden>🪀</span>
        </motion.div>
      }
      response={(
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(${visibleTargets.length}, minmax(0, 1fr))` }}>
          {visibleTargets.map((word) => (
            <GameWordButton key={word} label={getWordLabel(word, lang, settings.bilingualLabels)} icon="🔁" onClick={() => trigger("tapSelection", word)} />
          ))}
        </div>
      )}
      reward={reward}
      assistBar={<CaregiverAssistBar lang={lang} responseMode={settings.responseMode} onMarkGesture={() => trigger("caregiverMarkedGesture", visibleTargets[0])} onMarkVocal={() => trigger("caregiverMarkedVocalAttempt", visibleTargets[0])} onMarkImitation={() => trigger("imitationAttempt", visibleTargets[0])} onReplayModel={() => settings.audioModel && window?.speechSynthesis && window.speechSynthesis.speak(new SpeechSynthesisUtterance(visibleTargets[0]))} />}
    />
  );
}
