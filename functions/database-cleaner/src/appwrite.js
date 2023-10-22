import { Client, Databases, Query } from "node-appwrite";
import { getExpiryDate } from "./utils.js";

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

    async doesRoomExist(roomId) {
        try {
            await this.databases.getDocument(
                process.env.MASTER_DATABASE_ID,
                process.env.ROOMS_COLLECTION_ID,
                roomId
            );
            return true;
        } catch (err) {
            if (err.code !== 404) throw err;
            return false;
        }
    }

    async cleanParticipantsCollection() {
        const participantDocs = await this.databases.listDocuments(
            process.env.MASTER_DATABASE_ID,
            process.env.PARTICIPANTS_COLLECTION_ID
        );

        participantDocs.documents.forEach(async (participantDoc) => {
            if (!(await this.doesRoomExist(participantDoc.roomId))) {
                await this.databases.deleteDocument(
                    process.env.MASTER_DATABASE_ID,
                    process.env.PARTICIPANTS_COLLECTION_ID,
                    participantDoc.$id
                );
            }
        });
    }

    async cleanActivePairsCollection() {
        let done = true;
        const queries = [
            Query.lessThan("$createdAt", getExpiryDate()),
            Query.limit(25),
        ];
        do {
            const activePairDocs = await this.databases.listDocuments(
                process.env.MASTER_DATABASE_ID,
                process.env.ACTIVE_PAIRS_COLLECTION_ID,
                queries
            );
            await Promise.all(
                activePairDocs.documents.map((activePairDoc) =>
                    this.databases.deleteDocument(
                        process.env.MASTER_DATABASE_ID,
                        process.env.ACTIVE_PAIRS_COLLECTION_ID,
                        activePairDoc.$id
                    )
                )
            );
            done = activePairDocs.total === 0;
        } while (!done);
    }
}

export default AppwriteService;
