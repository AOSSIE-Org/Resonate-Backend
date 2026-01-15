import { createTransport } from 'nodemailer';

class MailService {
    constructor() {
        this.transporter = createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.SENDER_MAIL,
                pass: process.env.SENDER_PASSWORD,
            },
        });
    }

    async sendMail(recipientEmail, otp) {
        await this.transporter.sendMail({
            from: process.env.SENDER_MAIL, // sender address
            to: recipientEmail, // list of receivers
            subject: 'Email Verification', // Subject line
            text: `Greetings User, here is your email verification OTP: ${otp}`, // plain text body
        });
    }
}

export default MailService;
