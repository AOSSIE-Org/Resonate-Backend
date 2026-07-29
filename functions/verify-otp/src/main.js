import { Client, TablesDB, Query } from 'node-appwrite';
import { throwIfMissing } from './utils.js';

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        'APPWRITE_API_KEY',
        'VERIFICATION_DATABASE_ID',
        'OTP_TABLE_ID',
        'VERIFY_TABLE_ID',
    ]);

    const client = new Client()
        .setEndpoint(
            process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const db = new TablesDB(client);
    log(req.body);
    const {
        otpID,
        userOTP: userOtp,
        verify_ID: verificationId,
    } = JSON.parse(req.body);

    let otpDocument;

    try {
        const otpResult = await db.listRows({
            databaseId: process.env.VERIFICATION_DATABASE_ID,
            tableId: process.env.OTP_TABLE_ID,
            queries: [Query.equal('$id', [otpID])]
        });
        
        if (otpResult.rows.length === 0) {
            log("OTP document not found");
            return res.json({ message: "OTP not found" }, 404);
        }
        
        otpDocument = otpResult.rows[0];
    } catch (e) {
        log("error in getting the otp doc")
        error(String(e));
        return res.json({ message: String(e) }, 500);
    }

    try {
        await db.createRows({
            databaseId: process.env.VERIFICATION_DATABASE_ID,
            tableId: process.env.VERIFY_TABLE_ID,
            rows: [{
                $id: verificationId,
                status: String(otpDocument.otp === userOtp),
            }]
        });
    } catch (e) {
        log("error in creating the verification doc")
        error(String(e));
        return res.json({ message: String(e) }, 500);
    }
    return res.json({ message: 'null' }, 200);
};
