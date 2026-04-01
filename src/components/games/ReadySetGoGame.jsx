import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getWordLabel, getSpeechGameIcon, evaluateSpeechAttempt,
  GameWordButton, CommunicationGameShell, CaregiverAssistBar, useSpeechGameRound,
} from "./speechGameShared";

export default function ReadySetGoGame({ lang, settings, onGameEvent, onSessionHint }) {
  const [phase, setPhase] = useState("cue");
  const [reward, setReward] = useState({ active: false, reinforcer: settings.reinforcer });
  const targets = settings.targets?.length ? settings.targets : ["go"];
  const target = targets[0];
  const roundState = useSpeechGameRound({ rounds: settings.loopRounds, onSessionHint, advanceThreshold: settings.advanceThreshold });

  useEffect(() => {
    setPhase("cue");
    const timer = setTimeout(() => setPhase("wait"), settings.promptWaitMs);
    return () => clearTimeout(timer);
  }, [roundState.round, settings.promptWaitMs]);

  const trigger = (responseType, selectedWord) => {
    const outcome = evaluateSpeechAttempt({
      responseMode: settings.responseMode, responseType, selectedWord, targets, level: settings.level,
    });
    roundState.logAttempt(outcome);
    onGameEvent({ gameId: "readySetGo", responseType, target, reinforcer: settings.reinforcer, ...outcome });
    if (!outcome.attemptAccepted || phase !== "wait") return;
    setReward({ active: true, reinforcer: settings.reinforcer });
    setPhase("reward");
    setTimeout(() => {
      setReward({ active: false, reinforcer: settings.reinforcer });
      roundState.nextRound();
    }, 900);
  };

  return (
    <CommunicationGameShell
      lang={lang}
      title={lang === "te" ? "రెడీ-సెట్-గో" : "Ready-Set-Go"}
      subtitle={lang === "te" ? "'గో' చెప్పి కదలిక మొదలు పెట్టు" : "Say/select 'go' to start motion"}
      gameIcon="🚗"
      round={roundState.round}
      rounds={settings.loopRounds}
      promptText={settings.voicePrompts
        ? (phase === "wait" ? (lang === "te" ? "ఇప్పుడు చెప్పు: గో" : "Now say/select: go") : (lang === "te" ? "రెడీ... సెట్..." : "Ready... set..."))
        : (phase === "wait" ? getWordLabel(target, lang, settings.bilingualLabels) : "...")}
      scene={
        <motion.div animate={{ x: phase === "reward" ? 86 : 0 }} transition={{ duration: 0.5 }}>
          <span style={{ fontSize: 78 }} aria-hidden>🚗</span>
        </motion.div>
      }
      response={
        <GameWordButton label={getWordLabel(target, lang, settings.bilingualLabels)} icon="🟢" onClick={() => trigger("tapSelection", target)} />
      }
      aacStrip={settings.responseMode === "aac" ? (
        <div style={{ marginTop: 8 }}>
          <GameWordButton label={getWordLabel(target, lang, settings.bilingualLabels)} icon="📱" onClick={() => trigger("aacSelection", target)} />
        </div>
      ) : null}
      reward={reward}
      assistBar={(
        <CaregiverAssistBar
          lang={lang} responseMode={settings.responseMode}
          onMarkGesture={() => trigger("caregiverMarkedGesture", target)}
          onMarkVocal={() => trigger("caregiverMarkedVocalAttempt", target)}
          onMarkImitation={() => trigger("imitationAttempt", target)}
          onReplayModel={() => settings.audioModel && window?.speechSynthesis && window.speechSynthesis.speak(new SpeechSynthesisUtterance(target))}
        />
      )}
    />
  );
}
