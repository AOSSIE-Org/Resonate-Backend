const { createTransport } = require("nodemailer");

class MailService {
  constructor() {
    this.transporter = createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.SENDER_MAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    });
  }

  async sendMail(recipientEmail, otp) {
    await this.transporter.sendMail({
      from: process.env.SENDER_MAIL,
      to: recipientEmail,
      subject: "Email Verification",
      text: `Greetings User, here is your email verification OTP: ${otp}`,
    });
  }
}

module.exports = MailService;
