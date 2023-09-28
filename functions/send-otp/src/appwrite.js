import { Client, Databases } from 'node-appwrite';

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

    async createOtpDocument(otpId, otp) {
        await this.databases.createDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.OTP_COLLECTION_ID,
            otpId,
            {
                otp,
            }
        );
    }
}

export default AppwriteService;
