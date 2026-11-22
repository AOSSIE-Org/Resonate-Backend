import { Client, TablesDB } from 'node-appwrite';

class AppwriteService {
    constructor(apiKey) {
        const client = new Client()
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(apiKey);

        this.tables = new TablesDB(client);
    }

    async createOtpDocument(otpId, otp, date) {
        await this.tables.createRows({
            databaseId: process.env.VERIFICATION_DATABASE_ID,
            tableId: process.env.OTP_TABLE_ID,
            rows: [{
                $id: otpId,
                otp,
                date
            }]
        });
    }
}

export default AppwriteService;
