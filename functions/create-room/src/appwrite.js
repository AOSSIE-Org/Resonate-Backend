import { Client, TablesDB, ID } from "node-appwrite";

class AppwriteService {
    constructor() {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        this.tables = new TablesDB(client);
    }

    async createRoom(newRoomData) {
        const rowId = ID.unique();
        const newRoomRows = await this.tables.createRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            rows: [{ $id: rowId, ...newRoomData }]
        });

        return newRoomRows.rows[0].$id;
    }
}

export default AppwriteService;
