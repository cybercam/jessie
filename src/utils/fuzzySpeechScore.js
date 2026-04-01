// ─── FUZZY SPEECH SCORING ───────────────────────────────
// Levenshtein-based scorer: if Jessy says "a-p-l" for "apple",
// an exact-match comparison gives 0%, but this gives ~60% credit.
// Therapeutically correct — reward approximation, not perfection.

/**
 * Compute the Levenshtein edit distance between two strings.
 */
export function levenshtein(a, b) {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use single-row optimization for memory efficiency
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/**
 * Returns a similarity score between 0 and 1.
 *   1.0 = exact match
 *   0.0 = completely different
 *
 * Examples:
 *   fuzzySpeechScore("apple", "apl")   → ~0.6  (dropping vowels / letter-by-letter)
 *   fuzzySpeechScore("water", "wata")  → ~0.8
 *   fuzzySpeechScore("go", "go")       → 1.0
 *   fuzzySpeechScore("ball", "xyz")    → ~0.0
 */
export function fuzzySpeechScore(target, attempt) {
  const t = String(target || "").trim().toLowerCase();
  const a = String(attempt || "").trim().toLowerCase();

  if (!t || !a) return 0;
  if (t === a) return 1;

  const maxLen = Math.max(t.length, a.length);
  const distance = levenshtein(t, a);

  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Determine a qualitative rating from a fuzzy score.
 *
 *   score >= 0.85 → "close"    (nearly correct, small articulation difference)
 *   score >= 0.50 → "partial"  (recognizable approximation — encourage!)
 *   score >= 0.25 → "attempt"  (some correct elements, shape of the word)
 *   score <  0.25 → "distant"  (not yet matching, model again)
 */
export function scoreBand(score) {
  if (score >= 0.85) return "close";
  if (score >= 0.50) return "partial";
  if (score >= 0.25) return "attempt";
  return "distant";
}

/**
 * Check whether an attempt is "therapeutically acceptable" —
 * meaning Jessy produced enough of the word to warrant positive
 * reinforcement, even if not perfect.
 *
 * Default threshold: 0.35 (any attempt with ≥35% similarity counts).
 * This is lower than "partial" because for early speech therapy,
 * even rough approximations should be celebrated.
 */
export function isAcceptableAttempt(target, attempt, threshold = 0.35) {
  return fuzzySpeechScore(target, attempt) >= threshold;
}

/**
 * Given a target word and an array of candidate transcriptions,
 * find the best match and its score.
 */
export function bestMatch(target, candidates) {
  let best = { candidate: "", score: 0 };
  for (const c of candidates) {
    const s = fuzzySpeechScore(target, c);
    if (s > best.score) {
      best = { candidate: c, score: s };
    }
  }
  return best;
}
