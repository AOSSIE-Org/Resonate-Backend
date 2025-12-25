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
    if (!roomId || typeof roomId !== 'string') {
      log('Invalid roomId: must be a non-empty string');
      return res.json({ message: 'Invalid roomId' }, 400);
    }

    if (!payload || typeof payload !== 'object' || !payload.title || !payload.body) {
      log('Invalid payload: must be an object with title and body');
      return res.json({ message: 'Invalid payload' }, 400);
    }

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

    // Deduplicate and validate tokens (must be non-empty strings)
    const uniqueTokens = [...new Set(subscribersTokens)].filter(token => typeof token === 'string' && token.trim().length > 0);

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
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            log(`Failure for token ${uniqueTokens[idx]}: ${resp.error}`);
          }
        });
      } else {
        log('Notifications were sent successfully');
      }
    } else {
      log('No valid tokens found to send notifications.');
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
