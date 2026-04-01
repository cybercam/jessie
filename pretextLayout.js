import { layout, prepare } from "@chenglou/pretext";

const handleCache = new Map();

function getHandle(text, font) {
  const key = `${font}__${text}`;
  if (!handleCache.has(key)) {
    handleCache.set(key, prepare(text, font));
  }
  return handleCache.get(key);
}

export function measureBubble(text, options = {}) {
  const {
    font = "700 20px Nunito",
    lineHeight = 24,
    maxWidth = 220,
    paddingX = 20,
    paddingY = 14,
    minWidth = 64,
    minHeight = 44,
  } = options;

  try {
    const handle = getHandle(text, font);
    const result = layout(handle, maxWidth - paddingX * 2, lineHeight);
    const approxGlyphWidth = font.includes("20px") ? 11 : 10;
    const estimatedLineWidth = Math.min(maxWidth - paddingX * 2, Math.max(28, text.length * approxGlyphWidth));
    const width = Math.max(minWidth, Math.min(maxWidth, Math.ceil(estimatedLineWidth + paddingX * 2)));
    const height = Math.max(minHeight, Math.ceil(result.height + paddingY * 2));
    return {
      width,
      height,
      lineCount: result.lineCount,
    };
  } catch {
    return {
      width: Math.max(minWidth, Math.min(maxWidth, 72 + text.length * 10)),
      height: Math.max(minHeight, 48),
      lineCount: 1,
    };
  }
}

export function clearPretextCache() {
  handleCache.clear();
}
