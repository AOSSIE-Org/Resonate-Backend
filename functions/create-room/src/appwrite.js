import { Client, Databases, ID } from "node-appwrite";

class AppwriteService {
    constructor() {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        this.databases = new Databases(client);
    }

    async createRoom(newRoomData) {
        const newRoomDocRef = await this.databases.createDocument(
            process.env.MASTER_DATABASE_ID,
            process.env.ROOMS_COLLECTION_ID,
            ID.unique(),
            newRoomData
        );

        return newRoomDocRef.$id;
    }
}

export default AppwriteService;
