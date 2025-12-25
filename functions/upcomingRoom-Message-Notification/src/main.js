const sdk = require("node-appwrite");
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require("./resonate-service-account.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = async function ({ req, res, log, error }) {
  const subscribersTokens = [];
  const client = new sdk.Client();
  const database = new sdk.Databases(client);
  const query = sdk.Query;

  client.setEndpoint(
    process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { roomId, payload } = body;

    if (!roomId || !payload) {
      return res.json({
        message: 'Missing required fields',
        error: 'roomId and payload are required'
      }, 400);
    }

    log(`Sending notification for room: ${roomId}`);

    const subscriberList = await database.listDocuments(
      process.env.UpcomingRoomsDataBaseID,
      process.env.SubscriberCollectionID,
      [query.equal('upcomingRoomId', [roomId])]
    );

    subscriberList.documents.forEach(subscriber => {
      if (subscriber["registrationTokens"] && Array.isArray(subscriber["registrationTokens"])) {
        subscribersTokens.push(...subscriber["registrationTokens"]);
      }
    });

    const roomDocument = await database.getDocument(
      process.env.UpcomingRoomsDataBaseID,
      process.env.UpcomingRoomsCollectionID,
      roomId
    );

    if (roomDocument["creator_fcm_tokens"] && Array.isArray(roomDocument["creator_fcm_tokens"])) {
      subscribersTokens.push(...roomDocument["creator_fcm_tokens"]);
    }

    // Deduplicate tokens
    const uniqueTokens = [...new Set(subscribersTokens)];

    if (uniqueTokens.length > 0) {
      const message = {
        notification: payload,
        tokens: uniqueTokens,
        android: {
          priority: "high"
        },
        apns: {
          headers: {
            "apns-priority": "10"
          }
        }
      };

      const response = await getMessaging(app).sendEachForMulticast(message);
      if (response.failureCount > 0) {
        log(`Failed to send ${response.failureCount} notifications`);
      } else {
        log('Notifications were sent successfully');
      }
    } else {
      log('No tokens found to send notifications.');
    }

    return res.json({
      message: 'Notification process completed'
    });

  } catch (err) {
    error(`Error in upcomingRoom-Message-Notification: ${err.message}`);
    return res.json({
      message: 'Error occurred',
      error: err.message
    }, 500);
  }
}
