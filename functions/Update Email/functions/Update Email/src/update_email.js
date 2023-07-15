const sdk = require("node-appwrite");

module.exports = async function (req, res) {
  const client = new sdk.Client();
  client
  .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
  .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
  .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'])
  .setSelfSigned(true);
  const payload = JSON.parse(req.payload);
  const uid = String(payload.User_ID);
  const email = String(payload.email);
  const users = new sdk.Users(client);
  var error = "No Error";
  await users.updateEmail(uid, email).catch(err=>{
    error = String(err);
  });

  res.json({
    message: error.toString()
  });
};