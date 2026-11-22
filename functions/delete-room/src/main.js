import { Client, TablesDB, Query } from "node-appwrite";
import { RoomServiceClient } from "livekit-server-sdk";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "MASTER_DATABASE_ID",
        "ROOMS_TABLE_ID",
        "PARTICIPANTS_TABLE_ID",
        "POLLS_TABLE_ID",
        "POLL_VOTES_TABLE_ID",
        "MESSAGES_TABLE_ID",
        "REPLY_TO_TABLE_ID",
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
            .setKey(req.headers["x-appwrite-key"])
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

        const roomResult = await tables.listRows({
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
        await tables.deleteRow({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            rowId: appwriteRoomDocId
        });

        const purge = async (tableId, onEach) => {
            let deleted = 0;
            for (;;) {
                const page = await tables.listRows({
                    databaseId: process.env.MASTER_DATABASE_ID,
                    tableId,
                    queries: [Query.equal("roomId", [appwriteRoomDocId]), Query.limit(100)]
                });
                if (page.rows.length === 0) return deleted;

                const ids = page.rows.map(r => r.$id);
                if (onEach) await onEach(ids);
                await Promise.all(ids.map(rowId => tables.deleteRow({
                    databaseId: process.env.MASTER_DATABASE_ID,
                    tableId,
                    rowId
                })));
                deleted += ids.length;
            }
        };

        log(`participants deleted: ${await purge(process.env.PARTICIPANTS_TABLE_ID)}`);
        log(`polls deleted: ${await purge(process.env.POLLS_TABLE_ID)}`);
        log(`poll votes deleted: ${await purge(process.env.POLL_VOTES_TABLE_ID)}`);

        const messagesDeleted = await purge(
            process.env.MESSAGES_TABLE_ID,
            async (messageIds) => {
                await Promise.all(messageIds.map(rowId =>
                    tables.deleteRow({
                        databaseId: process.env.MASTER_DATABASE_ID,
                        tableId: process.env.REPLY_TO_TABLE_ID,
                        rowId
                    }).catch(() => {})
                ));
            }
        );
        log(`messages deleted: ${messagesDeleted}`);

        // Delete livekit room
        await roomServiceClient.deleteRoom(appwriteRoomDocId);
        return res.json({ msg: "Room deleted successfully" });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Room deletion failed" }, 500);
    }
};
