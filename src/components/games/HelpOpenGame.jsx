import { useState } from "react";
import { motion } from "framer-motion";
import { C } from "../../data/constants";
import {
  getWordLabel, getSpeechGameIcon, evaluateSpeechAttempt,
  GameWordButton, CommunicationGameShell, CaregiverAssistBar, useSpeechGameRound,
} from "./speechGameShared";

export default function HelpOpenGame({ lang, settings, onGameEvent, onSessionHint }) {
  const [reward, setReward] = useState({ active: false, reinforcer: settings.reinforcer });
  const targets = settings.targets?.length ? settings.targets : ["help", "open"];
  const roundState = useSpeechGameRound({ rounds: settings.loopRounds, onSessionHint, advanceThreshold: settings.advanceThreshold });
  const visibleTargets = targets.slice(0, settings.level >= 2 ? 2 : 1);

  const trigger = (responseType, selectedWord) => {
    const outcome = evaluateSpeechAttempt({
      responseMode: settings.responseMode, responseType, selectedWord, targets: visibleTargets,
      phraseTarget: settings.level >= 3 ? `${selectedWord} box` : "", level: settings.level,
    });
    roundState.logAttempt(outcome);
    onGameEvent({ gameId: "helpOpen", responseType, target: selectedWord, reinforcer: settings.reinforcer, ...outcome });
    if (!outcome.attemptAccepted) return;
    setReward({ active: true, reinforcer: settings.reinforcer });
    setTimeout(() => { setReward({ active: false, reinforcer: settings.reinforcer }); roundState.nextRound(); }, 850);
  };

  return (
    <CommunicationGameShell
      lang={lang}
      title={lang === "te" ? "హెల్ప్ / ఓపెన్" : "Help / Open"}
      subtitle={lang === "te" ? "బాక్స్ తెరవాలంటే కమ్యూనికేట్ చేయాలి" : "Open container through communication"}
      gameIcon="📦"
      round={roundState.round} rounds={settings.loopRounds}
      promptText={settings.voicePrompts ? (lang === "te" ? "'హెల్ప్' లేదా 'ఓపెన్' చెప్పు/ట్యాప్ చెయ్యి" : "Say/tap help or open") : (lang === "te" ? "సెలెక్ట్ చెయ్యి" : "Select")}
      scene={(
        <div style={{ position: "relative", width: 190, height: 130 }}>
          <motion.div animate={{ opacity: reward.active ? 1 : 0.2, scale: reward.active ? 1 : 0.8 }} transition={{ duration: 0.35 }} style={{ position: "absolute", left: "50%", marginLeft: -19, top: 10, fontSize: 38 }} aria-hidden>🧸</motion.div>
          <motion.div animate={{ rotateX: reward.active ? -62 : 0, y: reward.active ? -8 : 0 }} transition={{ duration: 0.35 }} style={{ position: "absolute", left: "50%", marginLeft: -66, top: 30, width: 132, height: 34, borderRadius: 12, border: "1px solid rgba(255,255,255,0.35)", background: "linear-gradient(160deg, rgba(255,241,204,0.55), rgba(226,170,96,0.55))", transformOrigin: "center bottom", boxShadow: "0 8px 14px rgba(0,0,0,0.2)" }} />
          <div style={{ position: "absolute", left: "50%", marginLeft: -70, bottom: 10, width: 140, height: 76, borderRadius: 14, border: "1px solid rgba(255,255,255,0.35)", background: "linear-gradient(170deg, rgba(230,178,98,0.85), rgba(170,115,54,0.75))", boxShadow: "0 14px 26px rgba(0,0,0,0.25)" }} />
          {reward.active && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: -2 }} style={{ position: "absolute", right: 22, top: 6, fontSize: 28 }} aria-hidden>✨</motion.div>
          )}
        </div>
      )}
      response={(
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(${visibleTargets.length}, minmax(0, 1fr))` }}>
          {visibleTargets.map((word) => (
            <GameWordButton key={word} label={getWordLabel(word, lang, settings.bilingualLabels)} icon={getSpeechGameIcon(word)} onClick={() => trigger("tapSelection", word)} />
          ))}
        </div>
      )}
      reward={reward}
      assistBar={<CaregiverAssistBar lang={lang} responseMode={settings.responseMode} onMarkGesture={() => trigger("caregiverMarkedGesture", visibleTargets[0])} onMarkVocal={() => trigger("caregiverMarkedVocalAttempt", visibleTargets[0])} onMarkImitation={() => trigger("imitationAttempt", visibleTargets[0])} onReplayModel={() => settings.audioModel && window?.speechSynthesis && window.speechSynthesis.speak(new SpeechSynthesisUtterance(visibleTargets[0]))} />}
    />
  );
}
