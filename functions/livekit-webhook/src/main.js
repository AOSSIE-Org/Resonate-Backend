import AppwriteService from './appwrite.js';
import LivekitService from './livekit.js';
import { throwIfMissing } from './utils.js';

export default async (context) => {
    const { req, res, log, error } = context;

    throwIfMissing(process.env, [
        'APPWRITE_API_KEY',
        'MASTER_DATABASE_ID',
        'ROOMS_COLLECTION_ID',
        'PARTICIPANTS_COLLECTION_ID',
        'LIVEKIT_API_KEY',
        'LIVEKIT_API_SECRET',
    ]);

    const appwrite = new AppwriteService();
    const livekit = new LivekitService();

    try {
        const event = livekit.validateWebhook(context, req);
        if (!event) {
            return res.json({ success: false }, 401);
        }

        log(event);

        if (event.event === 'room_finished') {
            const appwriteRoomDocId = event.room.name;

            const roomExists = await appwrite.doesRoomExist(appwriteRoomDocId);
            log(`Room ${appwriteRoomDocId} exists: ${roomExists}`);

            if (roomExists) {
                await appwrite.deleteRoom(appwriteRoomDocId);
            }
        }
    } catch (e) {
        error(String(e));
        return res.json({ success: false }, 500);
    }

    return res.json({ success: true }, 200);
};
