import { useState } from "react";
import { motion } from "framer-motion";
import {
  getWordLabel, getSpeechGameIcon, evaluateSpeechAttempt,
  GameWordButton, CommunicationGameShell, CaregiverAssistBar, useSpeechGameRound,
} from "./speechGameShared";

export default function BubbleRequestGame({ lang, settings, onGameEvent, onSessionHint }) {
  const [reward, setReward] = useState({ active: false, reinforcer: "bubbles" });
  const targets = settings.targets?.length ? settings.targets : ["more", "go", "open"];
  const roundState = useSpeechGameRound({ rounds: settings.loopRounds, onSessionHint, advanceThreshold: settings.advanceThreshold });
  const bubbleParticles = [0, 1, 2, 3, 4, 5, 6];

  const trigger = (responseType, selectedWord) => {
    const outcome = evaluateSpeechAttempt({
      responseMode: settings.responseMode, responseType, selectedWord, targets,
      phraseTarget: settings.level >= 3 ? "more bubbles" : "", level: settings.level,
    });
    roundState.logAttempt(outcome);
    onGameEvent({ gameId: "bubbleRequest", responseType, target: selectedWord, reinforcer: "bubbles", ...outcome });
    if (!outcome.attemptAccepted) return;
    setReward({ active: true, reinforcer: "bubbles" });
    setTimeout(() => { setReward({ active: false, reinforcer: "bubbles" }); roundState.nextRound(); }, 850);
  };

  return (
    <CommunicationGameShell
      lang={lang}
      title={lang === "te" ? "బబుల్ రిక్వెస్ట్" : "Bubble Request"}
      subtitle={lang === "te" ? "మాట/ట్యాప్ తర్వాతే బబుల్స్" : "Bubbles appear only after communication"}
      gameIcon="🫧"
      round={roundState.round} rounds={settings.loopRounds}
      promptText={settings.voicePrompts ? (lang === "te" ? "'ఇంకా/గో/ఓపెన్' చెప్పు లేదా ట్యాప్ చెయ్యి" : "Say/tap 'more', 'go', or 'open'") : (lang === "te" ? "ఎంచుకో" : "Select")}
      scene={(
        <div style={{ position: "relative", width: 220, height: 140, overflow: "hidden" }}>
          <motion.div animate={{ y: reward.active ? -3 : 0 }} transition={{ duration: 0.5, repeat: reward.active ? 1 : 0, repeatType: "reverse" }} style={{ position: "absolute", left: "50%", marginLeft: -34, bottom: 4, fontSize: 68 }} aria-hidden>🫙</motion.div>
          {bubbleParticles.map((idx) => (
            <motion.div key={`bubble-${idx}`}
              initial={{ y: 120, opacity: 0, x: 95 + (idx % 3) * 16 }}
              animate={reward.active ? { y: 20 - idx * 10, opacity: [0, 0.9, 0.2], x: 70 + idx * 16 } : { y: 120, opacity: 0, x: 102 }}
              transition={{ duration: 0.85, delay: idx * 0.03, ease: "easeOut" }}
              style={{ position: "absolute", width: 16 + (idx % 3) * 8, height: 16 + (idx % 3) * 8, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.7)", background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.75), rgba(133,220,255,0.2))", boxShadow: "inset 0 0 10px rgba(255,255,255,0.25)" }}
            />
          ))}
        </div>
      )}
      response={
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(${Math.min(2, Math.max(1, targets.length))}, minmax(0, 1fr))` }}>
          {targets.slice(0, settings.level >= 2 ? 2 : 1).map((word) => (
            <GameWordButton key={word} label={getWordLabel(word, lang, settings.bilingualLabels)} icon={getSpeechGameIcon(word)} onClick={() => trigger("tapSelection", word)} />
          ))}
        </div>
      }
      aacStrip={settings.responseMode === "aac" ? (
        <div style={{ marginTop: 8, display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {targets.slice(0, 3).map((word) => (
            <GameWordButton key={`aac-${word}`} label={getWordLabel(word, lang, settings.bilingualLabels)} icon={getSpeechGameIcon(word)} onClick={() => trigger("aacSelection", word)} />
          ))}
        </div>
      ) : null}
      reward={reward}
      assistBar={<CaregiverAssistBar lang={lang} responseMode={settings.responseMode} onMarkGesture={() => trigger("caregiverMarkedGesture", targets[0])} onMarkVocal={() => trigger("caregiverMarkedVocalAttempt", targets[0])} onMarkImitation={() => trigger("imitationAttempt", targets[0])} onReplayModel={() => settings.audioModel && window?.speechSynthesis && window.speechSynthesis.speak(new SpeechSynthesisUtterance(targets[0]))} />}
    />
  );
}
