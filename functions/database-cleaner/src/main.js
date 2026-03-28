import AppwriteService from "./appwrite.js";
import { throwIfMissing } from "./utils.js";

export default async (context) => {
    const { res, log, error } = context;

    // Environment validation
    try {
        throwIfMissing(process.env, [
            "APPWRITE_API_KEY",
            "ROOMS_COLLECTION_ID",
            "PARTICIPANTS_COLLECTION_ID",
            "ACTIVE_PAIRS_COLLECTION_ID",
            "RETENTION_PERIOD_DAYS",
            "VERIFICATION_DATABASE_ID",
            "OTP_COLLECTION_ID",
        ]);
    } catch (err) {
        error("[ENV_ERROR] " + err.message);
        return res.json({
            success: false,
            message: err.message,
        }, 500);
    }

    const appwrite = new AppwriteService();

    // Cleanup Participants
    try {
        await appwrite.cleanParticipantsCollection();
        log("[CLEANUP] Participants collection cleaned");
    } catch (e) {
        error("[CLEANUP_ERROR] Participants: " + String(e));
    }

    // Cleanup Active Pairs
    try {
        await appwrite.cleanActivePairsCollection();
        log("[CLEANUP] Active pairs collection cleaned");
    } catch (e) {
        error("[CLEANUP_ERROR] ActivePairs: " + String(e));
    }

    // Cleanup OTPs
    try {
        await appwrite.clearOldOTPs();
        log("[CLEANUP] Old OTPs cleared");
    } catch (e) {
        error("[CLEANUP_ERROR] OTP: " + String(e));
    }

    return res.json({
        success: true,
        message: "Database cleanup completed and expired OTPs cleared",
    });
};