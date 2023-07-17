const sdk = require("node-appwrite");

module.exports = async function (req, res) {
  const client = new sdk.Client();

  const users = new sdk.Users(client);
    client
      .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'])
      .setSelfSigned(true);
  var payload = JSON.parse(req.payload);
  var uid = payload.userID;
  users.updateEmailVerification(String(uid), true);
  res.json({
    message: 'set verified'
  });
};
