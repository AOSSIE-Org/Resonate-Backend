import AppwriteService from "./appwrite.js";
import LivekitService from "./livekit.js";
import { throwIfMissing, parseBody } from "./utils.js";

export default async ({ req, res, log, error }) => {
    // Validate environment variables
    try {
        throwIfMissing(process.env, [
            "APPWRITE_API_KEY",
            "MASTER_DATABASE_ID",
            "ROOMS_COLLECTION_ID",
            "LIVEKIT_HOST",
            "LIVEKIT_API_KEY",
            "LIVEKIT_API_SECRET",
            "LIVEKIT_SOCKET_URL",
        ]);
    } catch (err) {
        error("[ENV_ERROR] " + err.message);
        return res.json({
            success: false,
            message: err.message,
        }, 500);
    }

    const appwrite = new AppwriteService();
    const livekit = new LivekitService();

    let data;

    // ✅ Safe parsing + validation
    try {
        data = parseBody(req.body);
        throwIfMissing(data, ["name", "adminUid", "tags"]);
    } catch (err) {
        error("[VALIDATION_ERROR] " + err.message);
        return res.json({
            success: false,
            message: err.message,
        }, 400);
    }

    const { name, description = "", adminUid, tags } = data;

    try {
        log("[CREATE_ROOM_REQUEST]", { name, adminUid, tags });

        // Create room in Appwrite
        const newRoomdata = {
            name,
            description,
            adminUid,
            tags,
            totalParticipants: 1,
        };

        const appwriteRoomId = await appwrite.createRoom(newRoomdata);
        log("[APPWRITE_ROOM_CREATED]", appwriteRoomId);

        // Create room in LiveKit
        const livekitRoomOptions = {
            name: appwriteRoomId,
            emptyTimeout: 300,
        };

        const livekitRoom = await livekit.createRoom(livekitRoomOptions);
        log("[LIVEKIT_ROOM_CREATED]", livekitRoom);

        // Generate token for admin
        const accessToken = livekit.generateToken(
            appwriteRoomId,
            adminUid,
            true
        );

        return res.json({
            success: true,
            message: "Room created successfully",
            data: {
                roomId: appwriteRoomId,
                livekit_room: livekitRoom,
                livekit_socket_url: process.env.LIVEKIT_SOCKET_URL,
                access_token: accessToken,
            },
        });
    } catch (e) {
        error("[CREATE_ROOM_ERROR] " + String(e));

        return res.json({
            success: false,
            message: "Room creation failed",
        }, 500);
    }
};
