// utils/validation.js
// Centralised validation helpers for Planning Poker.
// These functions are deliberately simple and use whitelists/regexes to avoid XSS.

/**
 * Validate a display name or story title.
 * Allows letters, numbers, spaces, hyphens, underscores, max 30 chars.
 */
export function isValidName(name) {
  const trimmed = (name || "").trim();
  const re = /^[A-Za-z0-9 _-]{1,30}$/;
  return re.test(trimmed);
}

/**
 * Validate a vote value based on the allowed deck type.
 * deckType: 'fibonacci' | 'tshirt' | 'custom'
 * For custom decks you would pass an allowedValues array.
 */
export function isValidVote(vote, deckType, allowedValues = []) {
  if (vote === null) return true; // clearing vote is allowed
  if (typeof vote !== "string") return false;
  const val = vote.trim();
  if (deckType === "fibonacci") {
    const fib = ["0","1","2","3","5","8","13","21","34","55","?","☕"]; // include common symbols
    return fib.includes(val);
  }
  if (deckType === "tshirt") {
    const sizes = ["XS","S","M","L","XL","XXL","?","☕"]; // example
    return sizes.includes(val);
  }
  // custom deck – validate against supplied whitelist
  return allowedValues.includes(val);
}

/**
 * Simple role validation.
 */
export function isValidRole(role) {
  return role === "voter" || role === "spectator";
}

/**
 * Validate session name.
 * Allows alphanumeric, spaces, and basic punctuation, max 50 chars.
 */
export function isValidSessionName(name) {
  const trimmed = (name || "").trim();
  const re = /^[A-Za-z0-9 _.,'!-]{1,50}$/;
  return re.test(trimmed);
}

/**
 * Validate card deck type.
 */
export function isValidDeckType(deckType) {
  return deckType === "fibonacci" || deckType === "tshirt" || deckType === "custom";
}

/**
 * Validate a story name (including optional timer suffix).
 * Allows alphanumeric, spaces, common punctuation, hyphens, underscores, pipe symbol, and digits. Max 150 chars.
 */
export function isValidStoryName(name) {
  const trimmed = (name || "").trim();
  const re = /^[A-Za-z0-9 _.,'!\-|()#@\[\]]{1,150}$/;
  return re.test(trimmed);
}
