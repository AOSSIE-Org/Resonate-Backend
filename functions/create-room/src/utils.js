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

export const parseBody = (body) => {
    if (!body) {
        throw new Error("Request body is empty");
    }

    try {
        return JSON.parse(body);
    } catch (err) {
        throw new Error("Invalid JSON body");
    }
}