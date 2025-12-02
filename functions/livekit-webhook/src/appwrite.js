import { Client, TablesDB, Query } from 'node-appwrite';

class AppwriteService {
    constructor() {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        this.tables = new TablesDB(client);
    }

    async doesRoomExist(roomId) {
        try {
            const result = await this.tables.getRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.ROOMS_TABLE_ID,
                queries: [Query.equal('$id', [roomId])]
            });
            return result.rows.length > 0;
        } catch (err) {
            if (err.code !== 404) throw err;
            return false;
        }
    }

    async deleteRoom(roomId) {
        // Deleting room doc inside rooms table in master database
        await this.tables.deleteRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            queries: [Query.equal('$id', [roomId])]
        });

        // Removing participants from table
        const participantColRef = await this.tables.listRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.PARTICIPANTS_TABLE_ID,
            queries: [Query.equal('roomId', [roomId])]
        });
        
        if (participantColRef.rows.length > 0) {
            const participantIds = participantColRef.rows.map(p => p.$id);
            await this.tables.deleteRows({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.PARTICIPANTS_TABLE_ID,
                queries: [Query.equal('$id', participantIds)]
            });
        }
    }
}

export default AppwriteService;
