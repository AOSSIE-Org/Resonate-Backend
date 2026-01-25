import { throwIfMissing } from "./utils.js";
import AppwriteService from "./appwrite.js";
import MailService from "./mail.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "APPWRITE_FUNCTION_PROJECT_ID",
        "SENDER_MAIL",
        "SENDER_PASSWORD",
        "VERIFICATION_DATABASE_ID", 
        "OTP_COLLECTION_ID",
    ]);

    const appwrite = new AppwriteService();
    const mailService = new MailService();

    try {
        log(req.body);
        const { otpID, email: recipientEmail } = JSON.parse(req.body);

        // Rate limit check: Check if user has requested OTP in the last 60 seconds
        const userDoc = await appwrite.getUserByEmail(recipientEmail);
        
        if (userDoc && userDoc.last_otp_sent) {
            const lastOtpSentTime = new Date(userDoc.last_otp_sent).getTime();
            const currentTime = Date.now();
            const timeDifference = (currentTime - lastOtpSentTime) / 1000; // Convert to seconds

            if (timeDifference < 60) {
                const remainingSeconds = Math.ceil(60 - timeDifference);
                return res.json(
                    { 
                        message: `Too many requests. Please wait ${remainingSeconds} second(s) before requesting another OTP.` 
                    },
                    429
                );
            }
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await mailService.sendMail(recipientEmail, otp);

        // Logic for deleting the otp when the Date changes
        const currentDate = new Date().toDateString();
        log(`Current Date: ${currentDate}`);

        await appwrite.createOtpDocument(otpID, otp, recipientEmail, currentDate);

        // Update last_otp_sent timestamp in user document
        if (userDoc) {
            try {
                await appwrite.updateUserLastOtpSent(userDoc.$id, new Date().toISOString());
            } catch (updateError) {
                // Log error but don't fail the request if timestamp update fails
                log(`Warning: Failed to update last_otp_sent timestamp: ${updateError}`);
            }
        }
        return res.json({ message: "mail sent" });
    } catch (e) {
        error(String(e));
        return res.json({ message: String(e) },500);
    }

   
};
