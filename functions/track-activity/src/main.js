import { throwIfMissing, parseBody } from "./utils.js";

export default async ({ req, res, log, error }) => {
    let data;

    try {
        data = parseBody(req.body);
        throwIfMissing(data, ["eventType", "userId"]);
    } catch (err) {
        error("[VALIDATION_ERROR] " + err.message);
        return res.json({
            success: false,
            message: err.message,
        }, 400);
    }

    const { eventType, userId, metadata = {} } = data;

    try {
        const activity = {
            eventType,
            userId,
            metadata,
            createdAt: new Date().toISOString(),
            source: "backend-function",
        };

        log("[ACTIVITY_TRACKED]", activity);

        return res.json({
            success: true,
            message: "Activity tracked successfully",
            data: activity,
        });
    } catch (e) {
        error("[TRACK_ACTIVITY_ERROR] " + String(e));

        return res.json({
            success: false,
            message: "Failed to track activity",
        }, 500);
    }
};