const { Client, Users } = require("node-appwrite");
const { throwIfMissing } = require("./utils.js");

module.exports = async ({ req, res, log, error }) => {
  throwIfMissing(process.env, ["APPWRITE_API_KEY"]);

  const client = new Client()
    .setEndpoint(
      process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
    )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  try {
    log(req.body);
    const { userID } = JSON.parse(req.body);
    await new Users(client).updateEmailVerification(userID, true);
  } catch (e) {
    error(String(e));
    return res.json({ message: String(e) }, 500);
  }

  return res.json({ message: "null" });
};
