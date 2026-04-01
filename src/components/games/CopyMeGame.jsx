import { useState } from "react";
import {
  getWordLabel, evaluateSpeechAttempt,
  GameWordButton, CommunicationGameShell, CaregiverAssistBar, useSpeechGameRound,
} from "./speechGameShared";

export default function CopyMeGame({ lang, settings, onGameEvent, onSessionHint }) {
  const [reward, setReward] = useState({ active: false, reinforcer: settings.reinforcer });
  const cues = settings.targets?.length ? settings.targets : ["clap", "tap", "mmm", "baa", "pa"];
  const [idx, setIdx] = useState(0);
  const roundState = useSpeechGameRound({ rounds: settings.loopRounds, onSessionHint, advanceThreshold: settings.advanceThreshold });
  const cue = cues[idx % cues.length];

  const trigger = (responseType, selectedWord = cue) => {
    const outcome = evaluateSpeechAttempt({
      responseMode: settings.responseMode, responseType, selectedWord, targets: [cue],
      phraseTarget: settings.level >= 3 ? `${cue} more` : "", level: settings.level,
    });
    roundState.logAttempt(outcome);
    onGameEvent({ gameId: "copyMe", responseType, target: cue, reinforcer: settings.reinforcer, ...outcome });
    if (!outcome.attemptAccepted) return;
    setReward({ active: true, reinforcer: settings.reinforcer });
    setTimeout(() => {
      setReward({ active: false, reinforcer: settings.reinforcer });
      setIdx((v) => (v + 1) % cues.length);
      roundState.nextRound();
    }, 850);
  };

  return (
    <CommunicationGameShell
      lang={lang}
      title={lang === "te" ? "కాపీ మీ" : "Copy Me"}
      subtitle={lang === "te" ? "ఏ ప్రయత్నమైనా రివార్డ్" : "Reward any imitation attempt"}
      gameIcon="👏"
      round={roundState.round} rounds={settings.loopRounds}
      promptText={settings.voicePrompts ? (lang === "te" ? `ఇది చేయి: ${getWordLabel(cue, lang, settings.bilingualLabels)}` : `Do this: ${getWordLabel(cue, lang, settings.bilingualLabels)}`) : getWordLabel(cue, lang, settings.bilingualLabels)}
      scene={<span style={{ fontSize: 82 }} aria-hidden>{cue === "clap" ? "👏" : cue === "tap" ? "☝️" : "😮"}</span>}
      response={<GameWordButton label={lang === "te" ? "ప్రయత్నించాను" : "Tried it"} icon="✅" onClick={() => trigger("imitationAttempt", cue)} />}
      reward={reward}
      assistBar={<CaregiverAssistBar lang={lang} responseMode={settings.responseMode} onMarkGesture={() => trigger("caregiverMarkedGesture", cue)} onMarkVocal={() => trigger("caregiverMarkedVocalAttempt", cue)} onMarkImitation={() => trigger("imitationAttempt", cue)} onReplayModel={() => settings.audioModel && window?.speechSynthesis && window.speechSynthesis.speak(new SpeechSynthesisUtterance(cue))} />}
    />
  );
}
