import { Client, Databases } from 'node-appwrite';
import { throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        'APPWRITE_API_KEY',
        'VERIFICATION_DATABASE_ID',
        'OTP_COLLECTION_ID',
        'VERIFY_COLLECTION_ID',
    ]);

    const client = new Client()
        .setEndpoint(
            process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);
    log(req.body);
    const {
        otpID,
        userOTP: userOtp,
        verify_ID: verificationId,
    } = JSON.parse(req.body);

    try {
        const otpDocument = await db.getDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.OTP_COLLECTION_ID,
            otpID
        );
    } catch (e) {
        log("error in getting the otp doc")
        error(String(e));
        return res.json({ message: String(e) }, 500);
    }

    try {
        await db.createDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.VERIFY_COLLECTION_ID,
            verificationId,
            {
                status: String(otpDocument.otp === userOtp),
            }
        );
    } catch (e) {
        log("error in creating the verification doc")
        error(String(e));
        return res.json({ message: String(e) }, 500);
    }
    return res.json({ message: 'null' }, 200);
};
