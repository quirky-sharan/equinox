/**
 * Crisis Detector — Real-time self-harm keyword detection utility.
 *
 * Detects crisis-related phrases in user input. Normalizes text
 * before matching to catch misspellings, shorthand, and obfuscation.
 *
 * This is a ONE-WAY trigger: once detected, even if erased, the
 * session is flagged via sessionStorage and cannot be undone by
 * the user clearing the input.
 */

const CRISIS_PHRASES = [
  // Direct self-harm
  "i want to die",
  "i wanna die",
  "i want to kill myself",
  "i wanna kill myself",
  "kill myself",
  "killing myself",
  "end my life",
  "end it all",
  "i don't want to live",
  "i dont want to live",
  "dont wanna live",
  "don't wanna live",
  "i don't want to be alive",
  "i dont want to be alive",
  "no reason to live",
  "not worth living",
  "better off dead",
  "wish i was dead",
  "wish i were dead",
  "want to disappear forever",
  "wanna disappear",
  "just want it to stop",
  "can't take it anymore",
  "cant take it anymore",
  "i give up on life",
  "life is not worth it",
  "nobody would miss me",
  "no one would miss me",
  "world is better without me",
  "thinking about ending",
  "planning to end",
  "hurt myself",
  "harm myself",
  "cut myself",
  "self harm",
  "self-harm",

  // Single keywords and common typos (relies on word boundaries if <= 5 chars)
  "die",
  "dying",
  "dead",
  "suicide",
  "suicid",
  "suiciding",
  "cuicide",
  "cuiciding",
  "kms",
  "kys",
  "unalive myself",
  "unalive me",
  "want to unalive",
  "wanna unalive",
  "unalive",
];

// Build a single regex from all phrases — word-boundary aware where possible
const _buildCrisisRegex = () => {
  const escaped = CRISIS_PHRASES.map((p) =>
    p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  // For short keywords (≤5 chars), use word boundaries; for phrases, don't
  const patterns = escaped.map((p) =>
    p.length <= 5 ? `\\b${p}\\b` : p
  );
  return new RegExp(patterns.join("|"), "i");
};

const CRISIS_REGEX = _buildCrisisRegex();
const SESSION_KEY = "crisis_triggered";

/**
 * Normalize input text for matching: lowercase, collapse whitespace,
 * strip decorative punctuation but keep apostrophes.
 */
function _normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ") // strip non-word chars except apostrophe + hyphen
    .replace(/\s+/g, " ")       // collapse whitespace
    .trim();
}

/**
 * Detect if the given text contains crisis-related content.
 * Also sets the session flag so the crisis page persists.
 *
 * @param {string} text - Raw user input
 * @returns {boolean} true if crisis content detected
 */
export function detectCrisis(text) {
  if (!text || typeof text !== "string") return false;
  const normalized = _normalize(text);
  if (CRISIS_REGEX.test(normalized)) {
    // Set persistent session flag — cannot be undone by clearing input
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch (e) {
      // sessionStorage may be unavailable in private browsing
    }
    return true;
  }
  return false;
}

/**
 * Check if the crisis flag was already triggered in this session.
 * Called on component mount to enforce the one-way redirect.
 */
export function isCrisisTriggered() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  } catch (e) {
    return false;
  }
}

/**
 * Clear the crisis flag — ONLY called when user consciously clicks
 * "Go back" on the SupportPage. Never called automatically.
 */
export function clearCrisisFlag() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // ignore
  }
}
