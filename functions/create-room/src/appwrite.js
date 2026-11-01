import { Client, TablesDB, ID } from "node-appwrite";

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

    async createRoom(newRoomData) {
        const rowId = ID.unique();
        const newRoom = await this.tables.createRow({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            rowId,
            data: newRoomData
        });

        return newRoom.$id;
    }
}

export default AppwriteService;
