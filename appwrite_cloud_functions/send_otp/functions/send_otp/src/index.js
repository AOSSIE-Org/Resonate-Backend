const sdk = require("node-appwrite");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    user: 'aossieorgforu@gmail.com',
    pass: '[get app password from fellow contributor]'
  }
});


module.exports = async function (req, res) {
  const client = new sdk.Client();
  const database = new sdk.Databases(client);

    client
      .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'])
      .setSelfSigned(true);
      const payload = JSON.parse(req.payload);
      var otp_ID = payload.otpID
      var email = payload.email
      var OTP = Math.floor(100000 + Math.random() * 900000)
  const info = await transporter.sendMail({
    from: 'aossieorgforu@gmail.com', // sender address
    to: email.toString(), // list of receivers
    subject: "Email Verification", // Subject line
    text: "Greetings User, here is your email verification OTP " + String(OTP), // plain text body
  });
  var error = "null";
  await database.createDocument(req.variables['DataBaseID'], req.variables['CollectionID'], otp_ID.toString(), {
    "otp": String(OTP)
  }).catch(err => {
    error = err.toString();
  })
  res.json({
    message: String(error)
  });
};
