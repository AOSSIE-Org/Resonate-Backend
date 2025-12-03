const throwIfMissing = (obj, keys) => {
  const missing = [];

  for (const key of keys) {
    if (!(key in obj)) {
      missing.push(key);
      continue;
    }

    const value = obj[key];
    if (value === null || value === undefined || value === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

module.exports = { throwIfMissing };
