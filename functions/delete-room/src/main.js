import { Client, Databases, Query } from "node-appwrite";
import { RoomServiceClient } from "livekit-server-sdk";
import { throwIfMissing, parseBody } from "./utils.js";

export default async ({ req, res, log, error }) => {
    // Environment validation (safe)
    try {
        throwIfMissing(process.env, [
            "APPWRITE_API_KEY",
            "MASTER_DATABASE_ID",
            "ROOMS_COLLECTION_ID",
            "PARTICIPANTS_COLLECTION_ID",
            "LIVEKIT_HOST",
            "LIVEKIT_API_KEY",
            "LIVEKIT_API_SECRET",
        ]);
    } catch (err) {
        error("[ENV_ERROR] " + err.message);
        return res.json({
            success: false,
            message: err.message,
        }, 500);
    }

    const databases = new Databases(
        new Client()
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY)
    );

    const roomServiceClient = new RoomServiceClient(
        process.env.LIVEKIT_HOST,
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    let data;

    // Safe parsing + validation
    try {
        data = parseBody(req.body);
        throwIfMissing(data, ["appwriteRoomDocId"]);
    } catch (err) {
        error("[VALIDATION_ERROR] " + err.message);
        return res.json({
            success: false,
            message: err.message,
        }, 400);
    }

    const { appwriteRoomDocId } = data;

    try {
        log("[DELETE_ROOM_REQUEST]", { appwriteRoomDocId });

        const appwriteRoom = await databases.getDocument(
            process.env.MASTER_DATABASE_ID,
            process.env.ROOMS_COLLECTION_ID,
            appwriteRoomDocId
        );

        const roomAdminUid = req.headers["x-appwrite-user-id"];

        if (appwriteRoom.adminUid !== roomAdminUid) {
            log("[AUTH_ERROR] User is not room admin");
            return res.json({
                success: false,
                message: "User is not room admin",
            }, 403);
        }

        // Delete Appwrite room document
        await databases.deleteDocument(
            process.env.MASTER_DATABASE_ID,
            process.env.ROOMS_COLLECTION_ID,
            appwriteRoomDocId
        );

        // Remove participants (FIXED async issue)
        const participantColRef = await databases.listDocuments(
            process.env.MASTER_DATABASE_ID,
            process.env.PARTICIPANTS_COLLECTION_ID,
            [Query.equal("roomId", [appwriteRoomDocId])]
        );

        log("[PARTICIPANTS_FOUND]", participantColRef.documents.length);

        await Promise.all(
            participantColRef.documents.map((participant) =>
                databases.deleteDocument(
                    process.env.MASTER_DATABASE_ID,
                    process.env.PARTICIPANTS_COLLECTION_ID,
                    participant.$id
                )
            )
        );

        // Delete LiveKit room
        await roomServiceClient.deleteRoom(appwriteRoomDocId);

        return res.json({
            success: true,
            message: "Room deleted successfully",
        });
    } catch (e) {
        error("[DELETE_ROOM_ERROR] " + String(e));

        return res.json({
            success: false,
            message: "Room deletion failed",
        }, 500);
    }
};
