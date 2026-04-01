import { layout, prepare } from "@chenglou/pretext";

const handleCache = new Map();
const measurementCache = new Map();
const MAX_CACHE_ENTRIES = 600;

function trimCache(cache) {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const firstKey = cache.keys().next().value;
  if (firstKey !== undefined) cache.delete(firstKey);
}

function getHandle(text, font) {
  const key = `${font}__${text}`;
  if (!handleCache.has(key)) {
    handleCache.set(key, prepare(text, font));
    trimCache(handleCache);
  }
  return handleCache.get(key);
}

function buildMeasureKey(text, font, maxTextWidth, lineHeight) {
  return `${font}__${lineHeight}__${maxTextWidth}__${text}`;
}

function hasLongUnbrokenToken(text) {
  return /[^\s]{28,}/u.test(String(text || ""));
}

function hasMixedTeluguEnglish(text) {
  const value = String(text || "");
  const hasTelugu = /[\u0C00-\u0C7F]/u.test(value);
  const hasLatin = /[A-Za-z]/u.test(value);
  return hasTelugu && hasLatin;
}

export function measureChatText(text, options = {}) {
  const {
    font = "600 14px Manrope",
    lineHeight = 22,
    maxTextWidth = 280,
    paddingY = 12,
  } = options;

  const safeText = String(text || "");
  const safeMaxTextWidth = Math.max(80, Math.floor(maxTextWidth));
  const key = buildMeasureKey(safeText, font, safeMaxTextWidth, lineHeight);
  if (measurementCache.has(key)) return measurementCache.get(key);

  let measuredHeight = lineHeight;
  let lineCount = 1;

  try {
    const handle = getHandle(safeText, font);
    const result = layout(handle, safeMaxTextWidth, lineHeight);
    measuredHeight = Math.max(lineHeight, Math.ceil(result.height));
    lineCount = Math.max(1, result.lineCount || 1);
  } catch {
    const roughLines = Math.max(1, Math.ceil(safeText.length / 28));
    measuredHeight = roughLines * lineHeight;
    lineCount = roughLines;
  }

  const payload = {
    lineCount,
    minHeight: measuredHeight + paddingY * 2,
    useAggressiveWrap: hasLongUnbrokenToken(safeText) || hasMixedTeluguEnglish(safeText),
  };

  measurementCache.set(key, payload);
  trimCache(measurementCache);
  return payload;
}

export function clearChatLayoutCache() {
  handleCache.clear();
  measurementCache.clear();
}
