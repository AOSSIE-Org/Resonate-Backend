import { Client, TablesDB, Query } from "node-appwrite";
import { getExpiryDate } from "./utils.js";

class AppwriteService {
    constructor(apiKey) {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(apiKey);

        this.tables = new TablesDB(client);
    }

    async liveIds(tableId) {
        const ids = new Set();
        let lastId = null;
        for (;;) {
            const queries = [Query.limit(100), Query.select(["$id"])];
            if (lastId !== null) queries.push(Query.cursorAfter(lastId));
            const page = await this.tables.listRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId,
                queries
            });
            if (page.rows.length === 0) return ids;
            for (const row of page.rows) ids.add(row.$id);
            lastId = page.rows[page.rows.length - 1].$id;
        }
    }

    // Bulk-deletes rows by id, 100 per request.
    async deleteByIds(tableId, ids) {
        for (let i = 0; i < ids.length; i += 100) {
            const chunk = ids.slice(i, i + 100);
            try {
                await Promise.all(chunk.map(rowId => this.tables.deleteRow({
                    databaseId: process.env.MASTER_DATABASE_ID,
                    tableId,
                    rowId
                })));
            } catch (error) {
                console.error(`Failed to delete ${chunk.length} rows from ${tableId}:`, error);
            }
        }
        return ids.length;
    }

    // Collects every row of a table up front (cursor pagination), so callers
    // can delete rows afterwards without invalidating an in-flight cursor.
    async listAllRows(tableId) {
        const rows = [];
        let lastId = null;
        while (true) {
            const queries = [Query.limit(100)];
            if (lastId !== null) {
                queries.push(Query.cursorAfter(lastId));
            }
            const page = await this.tables.listRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId,
                queries
            });
            rows.push(...page.rows);
            if (page.rows.length === 0) break;
            lastId = page.rows[page.rows.length - 1].$id;
        }
        return rows;
    }

    // Drops every row of childTableId whose roomId no longer names a live room.
    async cleanOrphansByRoom(childTableId) {
        const liveRooms = await this.liveIds(process.env.ROOMS_TABLE_ID);
        const rows = await this.listAllRows(childTableId);
        const orphans = rows.filter((row) => !liveRooms.has(row.roomId)).map((row) => row.$id);
        return this.deleteByIds(childTableId, orphans);
    }

    async cleanParticipantsCollection() {
        return this.cleanOrphansByRoom(process.env.PARTICIPANTS_TABLE_ID);
    }

    async cleanRoomPollsCollection() {
        return this.cleanOrphansByRoom(process.env.POLLS_TABLE_ID);
    }

    async cleanRoomPollVotesCollection() {
        const [liveRooms, livePolls] = await Promise.all([
            this.liveIds(process.env.ROOMS_TABLE_ID),
            this.liveIds(process.env.POLLS_TABLE_ID)
        ]);
        const rows = await this.listAllRows(process.env.POLL_VOTES_TABLE_ID);
        const orphans = rows
            .filter((row) => !liveRooms.has(row.roomId) || !livePolls.has(row.pollId))
            .map((row) => row.$id);
        return this.deleteByIds(process.env.POLL_VOTES_TABLE_ID, orphans);
    }

    async cleanMessagesCollection() {
        const liveRooms = await this.liveIds(process.env.ROOMS_TABLE_ID);
        const rows = await this.listAllRows(process.env.MESSAGES_TABLE_ID);
        const orphans = rows.filter((row) => !liveRooms.has(row.roomId)).map((row) => row.$id);
        await this.deleteByIds(process.env.REPLY_TO_TABLE_ID, orphans);
        return this.deleteByIds(process.env.MESSAGES_TABLE_ID, orphans);
    }

    async cleanActivePairsCollection() {
        let done = true;
        const queries = [
            Query.lessThan("$createdAt", getExpiryDate()),
            Query.limit(25),
        ];
        do {
            const activePairsList = await this.tables.listRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.ACTIVE_PAIRS_TABLE_ID,
                queries
            });
            
            if (activePairsList.rows.length > 0) {
                await this.tables.deleteRows({
                    databaseId: process.env.MASTER_DATABASE_ID,
                    tableId: process.env.ACTIVE_PAIRS_TABLE_ID,
                    queries: [Query.equal("$id", activePairsList.rows.map(r => r.$id))]
                });
            }
            
            done = activePairsList.total === 0;
        } while (!done);
    }



    // Clear all OTPs which are one day old
    async clearOldOTPs() {

        let done;

        const currentDate = new Date().toDateString();

        const queries = [
            Query.notEqual("date", currentDate),
            Query.limit(100),
        ];

        //
        do {
            const oneDayOldOTPs = await this.tables.listRows({
                databaseId: process.env.VERIFICATION_DATABASE_ID,
                tableId: process.env.OTP_TABLE_ID,
                queries
            });
    
            if (oneDayOldOTPs.rows.length > 0) {
                await this.tables.deleteRows({
                    databaseId: process.env.VERIFICATION_DATABASE_ID,
                    tableId: process.env.OTP_TABLE_ID,
                    queries: [Query.equal("$id", oneDayOldOTPs.rows.map(r => r.$id))]
                });
            }

            done = oneDayOldOTPs.total === 0;

        } while (!done);

        
    }
}

export default AppwriteService;
