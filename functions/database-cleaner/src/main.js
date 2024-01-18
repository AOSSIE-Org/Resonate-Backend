import AppwriteService from "./appwrite.js";
import { throwIfMissing } from "./utils.js";

export default async (context) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "ROOMS_COLLECTION_ID",
        "PARTICIPANTS_COLLECTION_ID",
        "ACTIVE_PAIRS_COLLECTION_ID",
        "RETENTION_PERIOD_DAYS",
        "VERIFICATION_DATABASE_ID",
        "OTP_COLLECTION_ID",
    ]);

    const appwrite = new AppwriteService();

    try {
        await appwrite.cleanParticipantsCollection();
    } catch (e) {
        context.error(String(e));
    }

    try {
        await appwrite.cleanActivePairsCollection();
    } catch (e) {
        context.error(String(e));
    }

    try {
        await appwrite.clearOldOTPs();
    } catch (e) {
        context.error(String(e));
    }

    return context.res.send("Database Cleanup completed. And unnecessary OTPs are also cleared.");
};
