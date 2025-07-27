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
  const { roomId, payload } = JSON.parse(req.body);

  client.setEndpoint(
    process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  log(process.env.APPWRITE_FUNCTION_PROJECT_ID);

  log("Send Notification");
  log(roomId);
  log(payload);
  let subscriberList = await database.listDocuments(process.env.UpcomingRoomsDataBaseID, process.env.SubscriberCollectionID, [query.equal('upcomingRoomId', [roomId])]);
  log("here as well")
  subscriberList.documents.forEach(subscriber => {
    for (const token of subscriber["registrationTokens"]) {
      subscribersTokens.push(token);
    }
  });
  let document = await database.getDocument(process.env.UpcomingRoomsDataBaseID, process.env.UpcomingRoomsCollectionID, roomId);
  for (const creator_token of document["creator_fcm_tokens"]) {
    subscribersTokens.push(creator_token);
  }
  log(subscribersTokens);
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


