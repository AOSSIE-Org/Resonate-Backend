import { Client, Databases, Query } from 'node-appwrite';

class AppwriteService {
    constructor() {
        const client = new Client()
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        this.databases = new Databases(client);
    }

    async createOtpDocument(otpId, otp, date) {
        await this.databases.createDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.OTP_COLLECTION_ID,
            otpId,
            {
                otp,
                date
            }
        );
    }

    async getUserByEmail(email) {
        try {
            const response = await this.databases.listDocuments(
                process.env.UserDataDatabaseID,
                process.env.UsersCollectionID,
                [Query.equal('email', email), Query.limit(1)]
            );
            return response.documents.length > 0 ? response.documents[0] : null;
        } catch (e) {
            // Return null if user not found or any error occurs
            return null;
        }
    }

    async updateUserLastOtpSent(userId, timestamp) {
        try {
            await this.databases.updateDocument(
                process.env.UserDataDatabaseID,
                process.env.UsersCollectionID,
                userId,
                {
                    last_otp_sent: timestamp
                }
            );
        } catch (e) {
            // If update fails, log but don't throw (non-critical)
            throw e;
        }
    }
}

export default AppwriteService;
