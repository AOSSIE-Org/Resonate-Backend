// Improved validation (handles falsy values correctly)
export const throwIfMissing = (obj, keys) => {
    const missing = [];

    for (let key of keys) {
        if (!(key in obj) || obj[key] === undefined || obj[key] === null) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
};

// Safe JSON parsing utility
export const parseBody = (body) => {
    if (!body) {
        throw new Error("Request body is empty");
    }

    try {
        return JSON.parse(body);
    } catch (err) {
        throw new Error("Invalid JSON body");
    }
};

// Utility for generating expiry date (used in cleanup / OTP)
export const getExpiryDate = () => {
    const retentionPeriod = +(process.env.RETENTION_PERIOD_DAYS ?? 1);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - retentionPeriod);
    return expiryDate.toISOString();
};