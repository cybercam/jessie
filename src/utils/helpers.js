import {
  PROVIDERS,
  DEFAULT_API_SETTINGS,
  DEFAULT_SPEECH_GAME_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  DEFAULT_SESSION_METRICS,
  SPEECH_GAME_TYPES,
  REINFORCER_OPTIONS,
  RESPONSE_MODES,
  GROQ_INTENT_MODEL_PRIORITY,
  LEVEL_CONFIG,
  LS_KEYS,
} from "../data/constants";

// ─── localStorage ────────────────────────────────────────

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/storage errors
  }
}

// ─── date helpers ────────────────────────────────────────

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function startOfWeekKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// ─── metrics helpers ─────────────────────────────────────

export function defaultDailyMetrics() {
  return {
    spontaneousRequests: 0,
    waits: 0,
    jointAttentionBids: 0,
    aacMessages: 0,
    frustrationEpisodes: 0,
    functionalAttempts: 0,
    gameAttempts: 0,
    gameAcceptedAttempts: 0,
    gameTargetMatches: 0,
    tapResponses: 0,
    aacResponses: 0,
    gestureResponses: 0,
    vocalResponses: 0,
    imitationResponses: 0,
    reinforcerBubbles: 0,
    reinforcerSpin: 0,
    reinforcerClap: 0,
    reinforcerStars: 0,
    reinforcerCheer: 0,
    routineCompletions: 0,
    sharedEngagementMinutes: 0,
    unengagedMoments: 0,
    byType: {
      imitation: 0,
      words: 0,
      songs: 0,
      jointAttention: 0,
      routine: 0,
      readySetGo: 0,
      bubbleRequest: 0,
      choice: 0,
      copyMe: 0,
      helpOpen: 0,
      moreAgain: 0,
    },
  };
}

export function normalizeSessionMetrics(input) {
  const weekStart = typeof input?.weekStart === "string" ? input.weekStart : startOfWeekKey();
  const rawDaily = input?.daily && typeof input.daily === "object" ? input.daily : {};
  const daily = {};
  Object.entries(rawDaily).forEach(([key, value]) => {
    const base = defaultDailyMetrics();
    daily[key] = {
      ...base,
      ...(value || {}),
      byType: {
        ...base.byType,
        ...(value?.byType || {}),
      },
    };
    daily[key].gameAttempts = Number(daily[key].gameAttempts || 0);
    daily[key].gameAcceptedAttempts = Number(daily[key].gameAcceptedAttempts || 0);
    daily[key].gameTargetMatches = Number(daily[key].gameTargetMatches || 0);
  });
  return { weekStart, daily };
}

// ─── speech game settings ────────────────────────────────

export function normalizeSpeechGameSettings(input) {
  const safeLevel = Number(input?.level);
  const level = [1, 2, 3, 4].includes(safeLevel) ? safeLevel : DEFAULT_SPEECH_GAME_SETTINGS.level;
  const responseMode = RESPONSE_MODES.includes(input?.responseMode) ? input.responseMode : DEFAULT_SPEECH_GAME_SETTINGS.responseMode;
  const preferredReinforcer = REINFORCER_OPTIONS.some((r) => r.id === input?.preferredReinforcer)
    ? input.preferredReinforcer
    : DEFAULT_SPEECH_GAME_SETTINGS.preferredReinforcer;
  const reinforcerPool = {
    ...DEFAULT_SPEECH_GAME_SETTINGS.reinforcerPool,
    ...(input?.reinforcerPool || {}),
  };
  const games = { ...DEFAULT_SPEECH_GAME_SETTINGS.games };
  SPEECH_GAME_TYPES.forEach((game) => {
    const incoming = input?.games?.[game.id] || {};
    const incomingTargets = Array.isArray(incoming.targets)
      ? incoming.targets.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean).slice(0, 6)
      : games[game.id].targets;
    games[game.id] = {
      ...games[game.id],
      ...incoming,
      targets: incomingTargets.length > 0 ? incomingTargets : games[game.id].targets,
      reinforcer: REINFORCER_OPTIONS.some((r) => r.id === incoming?.reinforcer) ? incoming.reinforcer : games[game.id].reinforcer,
      promptWaitMs: Math.min(2600, Math.max(600, Number(incoming?.promptWaitMs || games[game.id].promptWaitMs))),
      loopRounds: Math.min(10, Math.max(3, Number(incoming?.loopRounds || games[game.id].loopRounds))),
    };
  });
  const preferredWordCounts = input?.preferredWordCounts && typeof input.preferredWordCounts === "object"
    ? input.preferredWordCounts
    : {};
  return {
    ...DEFAULT_SPEECH_GAME_SETTINGS,
    ...input,
    level,
    responseMode,
    preferredReinforcer,
    reinforcerPool,
    voicePrompts: input?.voicePrompts !== false,
    bilingualLabels: input?.bilingualLabels !== false,
    audioModel: input?.audioModel !== false,
    advanceThreshold: Math.min(0.95, Math.max(0.5, Number(input?.advanceThreshold ?? DEFAULT_SPEECH_GAME_SETTINGS.advanceThreshold))),
    autoAdjustDifficulty: input?.autoAdjustDifficulty !== false,
    games,
    preferredWordCounts,
  };
}

export function normalizePracticeSettings(input) {
  const target = Number(input?.level1Target);
  const level1Target = [50, 75, 100].includes(target) ? target : DEFAULT_PRACTICE_SETTINGS.level1Target;
  const communicationMode = ["speech-only", "aac-speech", "aac-first"].includes(input?.communicationMode)
    ? input.communicationMode
    : DEFAULT_PRACTICE_SETTINGS.communicationMode;
  const speechGames = normalizeSpeechGameSettings(input?.speechGames);
  return { level1Target, communicationMode, speechGames };
}

// ─── API settings ────────────────────────────────────────

export function normalizeApiSettings(input) {
  const merged = {
    ...DEFAULT_API_SETTINGS,
    ...(input || {}),
    modelByProvider: {
      ...DEFAULT_API_SETTINGS.modelByProvider,
      ...(input?.modelByProvider || {}),
    },
    apiKeys: {
      ...DEFAULT_API_SETTINGS.apiKeys,
      ...(input?.apiKeys || {}),
    },
  };

  const normalizedModels = {};
  Object.keys(PROVIDERS).forEach((providerId) => {
    normalizedModels[providerId] = normalizeModelSelection(providerId, merged.modelByProvider?.[providerId]);
  });

  return {
    ...merged,
    providerId: PROVIDERS[merged.providerId] ? merged.providerId : "offline",
    modelByProvider: normalizedModels,
  };
}

export function getProviderDefaultModel(providerId) {
  if (providerId === "groq") return "auto";
  const provider = PROVIDERS[providerId];
  return provider?.models?.[0] || "";
}

export function normalizeModelSelection(providerId, selectedModel) {
  const provider = PROVIDERS[providerId];
  if (!provider) return selectedModel || "";
  const allowed = provider.models || [];
  if (providerId === "groq" && !selectedModel) return "auto";
  if (!selectedModel || !allowed.includes(selectedModel)) {
    return getProviderDefaultModel(providerId);
  }
  return selectedModel;
}

export function formatModelLabel(providerId, model, lang = "en") {
  if (providerId === "groq" && model === "auto") {
    return lang === "te" ? "auto (పని ఆధారంగా బెస్ట్ మోడల్)" : "auto (best model by task)";
  }
  return model;
}

export function getGroqCandidateModels(selectedModel, intent = "chat") {
  if (selectedModel && selectedModel !== "auto") return [selectedModel];
  const intentPool = GROQ_INTENT_MODEL_PRIORITY[intent] || GROQ_INTENT_MODEL_PRIORITY.chat;
  const providerPool = (PROVIDERS.groq.models || []).filter((model) => model !== "auto");
  return unique([...intentPool, ...providerPool, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]);
}

export function isModelSelectionError(statusCode, rawErrorText = "") {
  if (![400, 404, 422].includes(Number(statusCode))) return false;
  const text = String(rawErrorText).toLowerCase();
  return (
    text.includes("model") ||
    text.includes("not found") ||
    text.includes("does not exist") ||
    text.includes("unsupported") ||
    text.includes("invalid")
  );
}

// ─── misc ────────────────────────────────────────────────

export function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function isTokenValid(authState) {
  return Boolean(authState?.accessToken) && Date.now() < (authState?.expiresAt || 0) - 10000;
}

export function clampLevel1Target(n) {
  const parsed = Number(n);
  const safe = Number.isFinite(parsed) ? parsed : LEVEL_CONFIG.level1Target;
  return Math.max(LEVEL_CONFIG.level1Min, Math.min(LEVEL_CONFIG.level1Max, safe));
}

export function buildCountPool(items, level, level1Target = LEVEL_CONFIG.level1Target) {
  const safe = Array.isArray(items) ? items : [];
  const normalizedTarget = clampLevel1Target(level1Target);
  const sorted = [...safe].sort((a, b) => (a.level || 1) - (b.level || 1));
  const level1Only = sorted.filter((item) => (item.level || 1) <= 1);
  const level2Allowed = sorted.filter((item) => (item.level || 1) <= 2);
  const l1Pool = (level1Only.length > 0 ? level1Only : sorted).slice(0, normalizedTarget);
  if (level <= 1) return l1Pool;
  const l2Target = l1Pool.length + LEVEL_CONFIG.level2Additional;
  return (level2Allowed.length > 0 ? level2Allowed : sorted).slice(0, l2Target);
}
