const sdk = require("node-appwrite");

module.exports = async function (req, res) {
  const client = new sdk.Client();
  var isVerified = "false";
  const database = new sdk.Databases(client);
  var payload = JSON.parse(req.payload);
  var otp_ID = payload.otpID;
  var User_OTP = payload.userOTP;
  var verID = payload.verify_ID;
    client
      .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'])
      .setSelfSigned(true);
  var otpData = await database.getDocument(req.variables['DataBaseID'], req.variables['OTPCollectionID'], otp_ID.toString())
  var OTP = otpData['otp'];
  if(String(OTP) == String(User_OTP)){
    isVerified = "true";
  }
  await database.createDocument(req.variables['DataBaseID'], req.variables['VerifyCollectionID'], verID.toString(), {
    "status": isVerified
  })
  res.json({
    message: isVerified
  });
};
