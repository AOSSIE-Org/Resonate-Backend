import { Client, Databases, Query } from 'node-appwrite';

class AppwriteService {
    constructor() {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
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
            if (err.code !== 404) {
                console.error(`Error checking room existence: ${err.message}`);
            }
            return false;
        }
    }

    async deleteRoom(roomId) {
        // 1. Removing participants from collection (with pagination)
        let done = false;
        while (!done) {
            const participantColRef = await this.databases.listDocuments(
                process.env.MASTER_DATABASE_ID,
                process.env.PARTICIPANTS_COLLECTION_ID,
                [
                    Query.equal('roomId', [roomId]),
                    Query.limit(50)
                ]
            );

            if (participantColRef.documents.length > 0) {
                await Promise.all(
                    participantColRef.documents.map(async (participant) => {
                        try {
                            await this.databases.deleteDocument(
                                process.env.MASTER_DATABASE_ID,
                                process.env.PARTICIPANTS_COLLECTION_ID,
                                participant.$id
                            );
                        } catch (err) {
                            // Ignore 404 as it means it was already deleted
                            if (err.code !== 404) throw err;
                        }
                    })
                );
            } else {
                done = true;
            }
        }

        // 2. Deleting room doc inside rooms collection in master database
        try {
            await this.databases.deleteDocument(
                process.env.MASTER_DATABASE_ID,
                process.env.ROOMS_COLLECTION_ID,
                roomId
            );
        } catch (err) {
            if (err.code !== 404) throw err;
        }
    }
}

export default AppwriteService;
