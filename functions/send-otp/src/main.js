import { throwIfMissing } from "./utils.js";
import AppwriteService from "./appwrite.js";
import MailService from "./mail.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "VERIFICATION_DATABASE_ID",
        "OTP_COLLECTION_ID",
        "SENDER_MAIL",
        "SENDER_PASSWORD",
    ]);

    const appwrite = new AppwriteService();
    const mailService = new MailService();

    try {
        log(req.body);
        const { otpID, email: recipientEmail } = JSON.parse(req.body);

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await mailService.sendMail(recipientEmail, otp);

        // Logic for deleting the otp when the Date changes
        const currentDate = new Date().toDateString();
        log(`Current Date: ${currentDate}`);

        await appwrite.createOtpDocument(otpID, otp, currentDate);
    } catch (e) {
        error(String(e));
        return res.json({ message: String(e) });
    }

    return res.json({ message: "mail sent" });
};
