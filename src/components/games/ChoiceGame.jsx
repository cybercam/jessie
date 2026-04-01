import { useState } from "react";
import { motion } from "framer-motion";
import { C } from "../../data/constants";
import {
  getWordLabel, getSpeechGameIcon, evaluateSpeechAttempt,
  GameWordButton, CommunicationGameShell, CaregiverAssistBar, useSpeechGameRound,
} from "./speechGameShared";

export default function ChoiceGame({ lang, settings, onGameEvent, onSessionHint }) {
  const [reward, setReward] = useState({ active: false, reinforcer: settings.reinforcer });
  const targets = settings.targets?.length ? settings.targets : ["ball", "apple", "book"];
  const [idx, setIdx] = useState(0);
  const [lastSelectedWord, setLastSelectedWord] = useState("");
  const roundState = useSpeechGameRound({ rounds: settings.loopRounds, onSessionHint, advanceThreshold: settings.advanceThreshold });
  const pair = [targets[idx % targets.length], targets[(idx + 1) % targets.length]];

  const trigger = (responseType, selectedWord) => {
    const outcome = evaluateSpeechAttempt({
      responseMode: settings.responseMode, responseType, selectedWord, targets: pair,
      phraseTarget: settings.level >= 3 ? `want ${selectedWord}` : "", level: settings.level,
    });
    roundState.logAttempt(outcome);
    onGameEvent({ gameId: "choice", responseType, target: selectedWord, reinforcer: settings.reinforcer, ...outcome });
    if (!outcome.attemptAccepted) return;
    setLastSelectedWord(selectedWord);
    setReward({ active: true, reinforcer: settings.reinforcer });
    setTimeout(() => {
      setReward({ active: false, reinforcer: settings.reinforcer });
      setIdx((v) => (v + 1) % targets.length);
      roundState.nextRound();
    }, 850);
  };

  return (
    <CommunicationGameShell
      lang={lang}
      title={lang === "te" ? "చాయిస్ గేమ్" : "Choice Game"}
      subtitle={lang === "te" ? "రెండు వాటిలో ఒకటి ఎంచుకో" : "Pick one of two preferred objects"}
      gameIcon="🧸"
      round={roundState.round} rounds={settings.loopRounds}
      promptText={settings.voicePrompts ? (lang === "te" ? "ఏది కావాలి?" : "Which one?") : (lang === "te" ? "ఎంచుకో" : "Choose")}
      scene={(
        <motion.div
          animate={{ scale: reward.active ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 0.5 }}
          style={{
            display: "grid", placeItems: "center", width: 120, height: 120, borderRadius: 30,
            border: `1px solid ${C.border}`,
            background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03))",
            boxShadow: "0 12px 26px rgba(8,16,32,0.3)", fontSize: 62,
          }}
          aria-hidden
        >
          {reward.active ? getSpeechGameIcon(lastSelectedWord || pair[0]) : "👀"}
        </motion.div>
      )}
      response={(
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {pair.map((word) => (
            <GameWordButton key={word} label={getWordLabel(word, lang, settings.bilingualLabels)} icon={getSpeechGameIcon(word)} onClick={() => trigger("tapSelection", word)} />
          ))}
        </div>
      )}
      aacStrip={settings.responseMode === "aac" ? (
        <div style={{ marginTop: 8, display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {pair.map((word) => (
            <GameWordButton key={`aac-${word}`} label={getWordLabel(word, lang, settings.bilingualLabels)} icon={getSpeechGameIcon(word)} onClick={() => trigger("aacSelection", word)} />
          ))}
        </div>
      ) : null}
      reward={reward}
      assistBar={<CaregiverAssistBar lang={lang} responseMode={settings.responseMode} onMarkGesture={() => trigger("caregiverMarkedGesture", pair[0])} onMarkVocal={() => trigger("caregiverMarkedVocalAttempt", pair[0])} onMarkImitation={() => trigger("imitationAttempt", pair[0])} onReplayModel={() => settings.audioModel && window?.speechSynthesis && window.speechSynthesis.speak(new SpeechSynthesisUtterance(pair[0]))} />}
    />
  );
}
