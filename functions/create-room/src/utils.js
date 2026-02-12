export const throwIfMissing = (obj, keys) => {
    const missing = [];
    for (let key of keys) {
        if (!(key in obj) || !obj[key]) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
};

export function validateCreateRoomInput(body) {
    const { name, description, adminUid, tags } = body;
    if (typeof name !== "string" || name.trim().length === 0) {
        throw new Error("Invalid room name");
    }
    if (typeof adminUid !== "string" || adminUid.trim().length === 0) {
        throw new Error("Invalid adminUid");
    }
    if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string")) {
        throw new Error("Tags must be an array of strings");
    }
    if (description !== undefined && typeof description !== "string") {
        throw new Error("Description must be a string");
    }
    return {
        name: name.trim(),
        description: typeof description === "string" ? description.trim() : "",
        adminUid: adminUid.trim(),
        tags,
    };
}

