import { Client, TablesDB } from 'node-appwrite';

class AppwriteService {
    constructor() {
        const client = new Client()
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

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
