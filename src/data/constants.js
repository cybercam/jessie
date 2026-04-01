// ─── DESIGN TOKENS ─────────────────────────────────────
export const C = {
  bg: "#04070F",
  bgSoft: "#101A33",
  card: "rgba(14, 24, 49, 0.78)",
  cardStrong: "rgba(20, 33, 63, 0.93)",
  primary: "#8FA0FF",
  primaryLight: "rgba(143, 160, 255, 0.22)",
  secondary: "#54E5DA",
  secondaryLight: "rgba(84, 229, 218, 0.2)",
  accent: "#FFD887",
  accentLight: "rgba(255, 216, 135, 0.24)",
  purple: "#B08CFF",
  purpleLight: "rgba(176, 140, 255, 0.22)",
  text: "#F3F6FF",
  textLight: "#AEC0E8",
  success: "#56DFA5",
  border: "rgba(181, 201, 255, 0.28)",
  danger: "#FF83A5",
  shadow: "0 18px 52px rgba(4, 8, 20, 0.55)",
};

export const FONT_BODY = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_HEADING = "'Fraunces', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', serif";

export const CARD_STYLE = {
  background: `linear-gradient(165deg, ${C.cardStrong}, ${C.card})`,
  border: `1px solid ${C.border}`,
  boxShadow: `${C.shadow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
  backdropFilter: "blur(14px)",
};

// ─── TELUGU MAP ────────────────────────────────────────
export const TELUGU_MAP = {
  "amma": "అమ్మ", "nanna": "నాన్న", "water": "నీళ్ళు", "food": "ఆహారం",
  "milk": "పాలు", "come": "రా", "go": "వెళ్ళు", "give": "ఇవ్వు",
  "want": "కావాలి", "no": "వద్దు", "yes": "అవును", "play": "ఆడు",
  "sleep": "నిద్ర", "eat": "తిను", "more": "ఇంకా", "help": "సహాయం",
  "happy": "సంతోషం", "sad": "బాధ", "apple": "ఆపిల్", "ball": "బంతి",
  "dog": "కుక్క", "cat": "పిల్లి", "bird": "పిట్ట", "fish": "చేప",
  "book": "పుస్తకం", "shoe": "చెప్పు", "hand": "చేయి", "eye": "కన్ను",
  "mouth": "నోరు", "nose": "ముక్కు", "hello": "నమస్తే", "bye": "బై",
  "big": "పెద్ద", "small": "చిన్న", "hot": "వేడి", "cold": "చల్లని",
  "up": "పైకి", "down": "కిందకి", "open": "తెరువు", "close": "మూయు",
  "wash": "కడుగు", "sit": "కూర్చో", "stand": "నిలబడు", "run": "పరుగు",
  "jump": "దూకు", "clap": "చప్పట్లు", "stop": "ఆపు", "look": "చూడు",
};

// ─── PRACTICE MODES & CATEGORIES ───────────────────────
export const WORD_CATEGORIES = [
  "all", "needs", "food", "actions", "responses",
  "feelings", "objects", "people", "social", "places", "descriptions",
];
export const PRACTICE_MODES = ["sequence", "random", "difficult"];
export const RESPONSE_MODES = ["tap-only", "tap-speech", "aac", "imitation"];

// ─── SPEECH GAME TYPES ─────────────────────────────────
export const SPEECH_GAME_TYPES = [
  { id: "readySetGo", en: "Ready-Set-Go", te: "రెడీ-సెట్-గో", icon: "🚗", defaultTargets: ["go"], defaultReinforcer: "spin" },
  { id: "bubbleRequest", en: "Bubble Request", te: "బబుల్ రిక్వెస్ట్", icon: "🫧", defaultTargets: ["more", "go", "open"], defaultReinforcer: "bubbles" },
  { id: "choice", en: "Choice Game", te: "చాయిస్ గేమ్", icon: "🧸", defaultTargets: ["ball", "apple", "book"], defaultReinforcer: "stars" },
  { id: "copyMe", en: "Copy Me", te: "నన్ను అనుకరించు", icon: "👏", defaultTargets: ["clap", "tap", "mmm", "baa", "pa"], defaultReinforcer: "clap" },
  { id: "helpOpen", en: "Help / Open", te: "హెల్ప్ / ఓపెన్", icon: "📦", defaultTargets: ["help", "open"], defaultReinforcer: "spin" },
  { id: "moreAgain", en: "More / Again", te: "మోర్ / అగైన్", icon: "🔁", defaultTargets: ["more", "again"], defaultReinforcer: "stars" },
];

export const REINFORCER_OPTIONS = [
  { id: "bubbles", en: "Bubbles", te: "బబుల్స్", emoji: "🫧" },
  { id: "spin", en: "Spin toy", te: "స్పిన్ టాయ్", emoji: "🌀" },
  { id: "clap", en: "Clap", te: "చప్పట్లు", emoji: "👏" },
  { id: "stars", en: "Stars", te: "స్టార్స్", emoji: "⭐" },
  { id: "cheer", en: "Cheer", te: "చీర్", emoji: "🎉" },
];

export const SPEECH_GAME_BY_TYPE = SPEECH_GAME_TYPES.reduce(
  (acc, item) => ({ ...acc, [item.id]: item }), {}
);

// ─── DEFAULT SETTINGS ──────────────────────────────────
export const DEFAULT_SPEECH_GAME_SETTINGS = {
  level: 1,
  responseMode: "tap-speech",
  voicePrompts: true,
  bilingualLabels: true,
  audioModel: true,
  preferredReinforcer: "bubbles",
  reinforcerPool: {
    bubbles: true, spin: true, clap: true, stars: true, cheer: false,
  },
  advanceThreshold: 0.7,
  autoAdjustDifficulty: true,
  games: SPEECH_GAME_TYPES.reduce((acc, item) => {
    acc[item.id] = {
      targets: item.defaultTargets,
      reinforcer: item.defaultReinforcer,
      promptWaitMs: 1200,
      loopRounds: 6,
    };
    return acc;
  }, {}),
  preferredWordCounts: {},
};

export const DEFAULT_PRACTICE_SETTINGS = {
  level1Target: 50,
  communicationMode: "aac-speech",
  speechGames: DEFAULT_SPEECH_GAME_SETTINGS,
};

export const DEFAULT_SESSION_METRICS = { weekStart: "", daily: {} };

export const DEFAULT_AUTH_STATE = {
  googleClientId: "",
  accessToken: "",
  expiresAt: 0,
  user: null,
  backupFileId: "",
};

export const DEFAULT_SYNC_PREFS = {
  autoSync: false,
  lastSyncAt: "",
  lastSyncStatus: "",
};

export const LS_KEYS = {
  wordStats: "jessy_word_stats_v1",
  apiSettings: "jessy_api_settings_v1",
  authState: "jessy_auth_state_v1",
  onboarding: "jessy_onboarding_v1",
  syncPrefs: "jessy_sync_prefs_v1",
  analysisHistory: "jessy_analysis_history_v1",
  practiceSettings: "jessy_practice_settings_v1",
  sessionMetrics: "jessy_session_metrics_v1",
};

// ─── LEVEL CONFIG ──────────────────────────────────────
export const LEVEL_CONFIG = {
  level1Min: 50,
  level1Max: 100,
  level1Target: 50,
  level2Additional: 100,
};

// ─── API PROVIDERS ─────────────────────────────────────
export const PROVIDERS = {
  offline: {
    id: "offline", label: "Offline", endpoint: "", models: ["local-coach"],
  },
  openrouter: {
    id: "openrouter", label: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    models: ["openrouter/auto", "meta-llama/llama-3.1-8b-instruct:free", "deepseek/deepseek-r1:free"],
  },
  groq: {
    id: "groq", label: "Groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    models: [
      "auto", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3-32b",
      "meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.3-70b-versatile", "llama-3.1-8b-instant",
    ],
  },
  geminiCompat: {
    id: "geminiCompat", label: "Gemini OpenAI Compatible",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-2.0-flash", "gemini-1.5-flash"],
  },
};

export const API_KEY_LINKS = {
  openrouter: "https://openrouter.ai/keys",
  groq: "https://console.groq.com/keys",
  geminiCompat: "https://aistudio.google.com/app/apikey",
};

export const GOOGLE_OAUTH_CLIENT_LINK = "https://console.cloud.google.com/apis/credentials";
export const GOOGLE_SCOPES = [
  "openid", "email", "profile", "https://www.googleapis.com/auth/drive.appdata",
].join(" ");

export const GROQ_INTENT_MODEL_PRIORITY = {
  chat: ["openai/gpt-oss-120b", "qwen/qwen3-32b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  reasoning: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3-32b", "llama-3.3-70b-versatile"],
  tip: ["qwen/qwen3-32b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  analysis: ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3-32b"],
  tools: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3-32b", "meta-llama/llama-4-scout-17b-16e-instruct"],
};

export const DEFAULT_API_SETTINGS = {
  providerId: "offline",
  modelByProvider: {
    openrouter: PROVIDERS.openrouter.models[0],
    groq: "auto",
    geminiCompat: PROVIDERS.geminiCompat.models[0],
    offline: PROVIDERS.offline.models[0],
  },
  apiKeys: { openrouter: "", groq: "", geminiCompat: "" },
  temperature: 0.4,
};

export const JESSY_SPEECH_ANALYSIS_PROMPT = `You are a supportive pediatric speech coaching assistant.
Context: Jessy understands language and wants to communicate, but has motor-planning speech difficulty (apraxia-like). She may break words into letter-like chunks rather than blending. AAC (Avaz) is encouraged. Grandparents need practical home guidance.
Rules:
- Non-diagnostic language only.
- Keep warm, practical, and short.
- Output strict JSON with keys: attempted, likelyPattern, modelNext, caregiverScript, confidence.
- confidence must be one of: low, medium, high.
- Telugu/English should follow user's requested language.
- Always include one immediate home activity and one caregiver sentence to model.
`;

// ─── DAILY ROUTINE ─────────────────────────────────────
export const DAILY_ROUTINE_STEPS = [
  { time: "5 min", title: "Imitation Warm-up", titleTe: "అనుకరణ వార్మ్-అప్", desc: "Body → Mouth → Sound imitation", descTe: "శరీరం → నోరు → శబ్దం అనుకరణ", icon: "🏃" },
  { time: "5 min", title: "Core Word Practice", titleTe: "ప్రధాన పదాల అభ్యాసం", desc: "Practice 3-5 words with Avaz AAC", descTe: "Avaz AAC తో 3-5 పదాలు అభ్యసించు", icon: "📱" },
  { time: "5 min", title: "Fill-in Song/Book", titleTe: "పాట/పుస్తకం పూరించు", desc: "Pause and let Jessy fill the word", descTe: "ఆపి జెస్సీని పదం చెప్పనివ్వు", icon: "🎵" },
  { time: "5 min", title: "Free Play + Modeling", titleTe: "స్వేచ్ఛా ఆట + మోడలింగ్", desc: "Play together, model words naturally", descTe: "కలిసి ఆడు, సహజంగా పదాలు చెప్పు", icon: "🧸" },
];
