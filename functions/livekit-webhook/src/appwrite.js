import { Client, TablesDB, Query } from 'node-appwrite';

class AppwriteService {
    constructor(apiKey) {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(apiKey);

        this.tables = new TablesDB(client);
    }

    async doesRoomExist(roomId) {
        try {
            const result = await this.tables.listRows({
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
        await this.tables.deleteRow({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            rowId: roomId
        });

        // Removing participants from table
        const participantColRef = await this.tables.listRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.PARTICIPANTS_TABLE_ID,
            queries: [Query.equal('roomId', [roomId])]
        });
        
        if (participantColRef.rows.length > 0) {
            const participantIds = participantColRef.rows.map(p => p.$id);
            await Promise.all(participantIds.map(rowId => this.tables.deleteRow({
                databaseId: process.env.MASTER_DATABASE_ID,
                tableId: process.env.PARTICIPANTS_TABLE_ID,
                rowId
            })));
        }
    }
}

export default AppwriteService;
