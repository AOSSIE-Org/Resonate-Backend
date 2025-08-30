const sdk = require("node-appwrite");

const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require("./resonate-service-account.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = async function ({ req, res, log, error }) {
  var subscribersTokens = [];
  const client = new sdk.Client();
  const database = new sdk.Databases(client);
  const query = sdk.Query;
  const { creatorId, payload } = JSON.parse(req.body);

  client.setEndpoint(
    process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  log(process.env.APPWRITE_FUNCTION_PROJECT_ID);

  log("Send Notification");
  log(creatorId);
  log(payload);
  let creatorDoc = await database.getDocument(process.env.UserDataDatabaseID, process.env.UsersCollectionID, creatorId);
  log("Creator document retrieved");

  // Extract FCM tokens from followers
  if (creatorDoc.followers && Array.isArray(creatorDoc.followers)) {
    creatorDoc.followers.forEach(follower => {
      if (follower.followerFCMToken) {
        subscribersTokens.push(follower.followerFCMToken);
      }
    });
  }

  log(subscribersTokens);

  // Check if we have any tokens to send notifications to
  if (!Array.isArray(subscribersTokens) || subscribersTokens.length === 0) {
    log('No FCM tokens found, skipping notification.');
    return res.json({ message: 'No followers to notify.' });
  }

  const message = {
    notification: payload,
    tokens: subscribersTokens,
    priority: "high",
    android: {
      priority: "high"
    }
  };
  getMessaging(app).sendEachForMulticast(message)
    .then((response) => {
      if (response.failureCount > 0) {
        log('Failed');
      } else {
        log('Notifications were sent successfully');
      }
    });

  return res.json({
    message: 'Notification sent'
  });
}


