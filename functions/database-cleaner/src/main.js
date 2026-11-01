import AppwriteService from "./appwrite.js";
import { throwIfMissing } from "./utils.js";

export default async (context) => {
    throwIfMissing(process.env, [
        "ROOMS_TABLE_ID",
        "PARTICIPANTS_TABLE_ID",
        "POLLS_TABLE_ID",
        "POLL_VOTES_TABLE_ID",
        "MESSAGES_TABLE_ID",
        "REPLY_TO_TABLE_ID",
        "ACTIVE_PAIRS_TABLE_ID",
        "RETENTION_PERIOD_DAYS",
        "VERIFICATION_DATABASE_ID",
        "OTP_TABLE_ID",
    ]);

    const appwrite = new AppwriteService(context.req.headers["x-appwrite-key"]);

    try {
        await appwrite.cleanParticipantsCollection();
    } catch (e) {
        context.error(String(e));
    }

    try {
        await appwrite.cleanRoomPollsCollection();
    } catch (e) {
        context.error(String(e));
    }

    try {
        await appwrite.cleanRoomPollVotesCollection();
    } catch (e) {
        context.error(String(e));
    }

    try {
        await appwrite.cleanMessagesCollection();
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
