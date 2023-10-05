import { Client, Databases, Query } from "node-appwrite";
import { RoomServiceClient } from "livekit-server-sdk";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "MASTER_DATABASE_ID",
        "ROOMS_COLLECTION_ID",
        "PARTICIPANTS_COLLECTION_ID",
        "LIVEKIT_HOST",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
    ]);

    const databases = new Databases(
        new Client()
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY)
    );

    const roomServiceClient = new RoomServiceClient(
        `${process.env.LIVEKIT_HOST}`,
        `${process.env.LIVEKIT_API_KEY}`,
        `${process.env.LIVEKIT_API_SECRET}`
    );

    try {
        throwIfMissing(JSON.parse(req.body), ["appwriteRoomDocId"]);
    } catch (err) {
        return res.json({ msg: err.message }, 400);
    }

    try {
        log(req);
        const { appwriteRoomDocId, livekitToken } = JSON.parse(req.body);

        const appwriteRoom = await databases.getDocument(
            process.env.MASTER_DATABASE_ID,
            process.env.ROOMS_COLLECTION_ID,
            appwriteRoomDocId
        );

        const roomAdminUid = req.headers["x-appwrite-user-id"];
        if (appwriteRoom.adminUid !== roomAdminUid) {
            log("User not room admin");
            return res.json({ msg: "User is not room admin" }, 403);
        }

        //Delete Appwrite room doc
        await databases.deleteDocument(
            process.env.MASTER_DATABASE_ID,
            process.env.ROOMS_COLLECTION_ID,
            appwriteRoomDocId
        );

        // Removing participants from collection
        const participantColRef = await databases.listDocuments(
            process.env.MASTER_DATABASE_ID,
            process.env.PARTICIPANTS_COLLECTION_ID,
            [Query.equal("roomId", [appwriteRoomDocId])]
        );
        log(participantColRef);
        participantColRef.documents.forEach(async (participant) => {
            await databases.deleteDocument(
                process.env.MASTER_DATABASE_ID,
                process.env.PARTICIPANTS_COLLECTION_ID,
                participant.$id
            );
        });

        // Delete livekit room
        await roomServiceClient.deleteRoom(appwriteRoomDocId);
        return res.json({ msg: "Room deleted successfully" });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Room deletion failed" }, 500);
    }
};
