import { Client, TablesDB, Query } from "node-appwrite";
import { RoomServiceClient } from "livekit-server-sdk";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "MASTER_DATABASE_ID",
        "ROOMS_TABLE_ID",
        "PARTICIPANTS_TABLE_ID",
        "LIVEKIT_HOST",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
    ]);

    const tables = new TablesDB(
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

        const roomResult = await tables.getRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            queries: [Query.equal("$id", [appwriteRoomDocId])]
        });
        
        if (roomResult.rows.length === 0) {
            log("Room not found");
            return res.json({ msg: "Room not found" }, 404);
        }
        
        const appwriteRoom = roomResult.rows[0];

        const roomAdminUid = req.headers["x-appwrite-user-id"];
        if (appwriteRoom.adminUid !== roomAdminUid) {
            log("User not room admin");
            return res.json({ msg: "User is not room admin" }, 403);
        }

        //Delete Appwrite room doc
        await tables.deleteRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            queries: [Query.equal("$id", [appwriteRoomDocId])]
        });

        // Removing participants from collection
        const participantColRef = await tables.listRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.PARTICIPANTS_TABLE_ID,
            queries: [Query.equal("roomId", [appwriteRoomDocId])]
        });
        log(participantColRef);
        
        if (participantColRef.rows.length > 0) {
            const participantIds = participantColRef.rows.map(p => p.$id);
            await tables.deleteRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.PARTICIPANTS_TABLE_ID,
                queries: [Query.equal("$id", participantIds)]
            });
        }

        // Delete livekit room
        await roomServiceClient.deleteRoom(appwriteRoomDocId);
        return res.json({ msg: "Room deleted successfully" });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Room deletion failed" }, 500);
    }
};
