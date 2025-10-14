
/**
 * Throws an error if any of the keys are missing from the object
 * @param {*} obj
 * @param {string[]} keys
 * @throws {Error}
 */
export function throwIfMissing(obj, keys) {
  const missing = [];
  for (let key of keys) {
    if (!(key in obj) || !obj[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Parse and validate query parameters for search
 * @param {Object} query - Query parameters
 * @returns {Object} Validated parameters
 */
export function parseQueryParams(query) {
  const q = query.q || '';
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = parseInt(query.offset) || 0;

  return { q, limit, offset };
}

