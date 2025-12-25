const sdk = require("node-appwrite");
const admin = require('firebase-admin');

// const { getMessaging } = require('firebase-admin/messaging');
// const serviceAccount = require("./resonate-service-account.json");
// const app = admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

module.exports = async function ({ req, res, log, error }) {
  const client = new sdk.Client();
  const database = new sdk.Databases(client);

  client.setEndpoint(
    process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  try {
    const upcomingRoomsList = await database.listDocuments(
      process.env.UpcomingRoomsDataBaseID,
      process.env.UpcomingRoomsCollectionID
    );

    for (const document of upcomingRoomsList.documents) {
      const scheduledDateTime = document["scheduledDateTime"];
      
      // Use standard Date parsing (handles ISO 8601 correctly)
      const upcomingRoomDate = new Date(scheduledDateTime).getTime();
      const nowTime = new Date().getTime();

      const timeLeft = upcomingRoomDate - nowTime;
      const timeLeftInMinutes = timeLeft / (1000 * 60);

      // Check if time is within +/- 5 minutes and not yet marked
      if (timeLeftInMinutes <= 5 && timeLeftInMinutes >= -5 && document["isTime"] === false) {
        await database.updateDocument(
          process.env.UpcomingRoomsDataBaseID, 
          process.env.UpcomingRoomsCollectionID, 
          document.$id, 
          {
            "isTime": true
          }
        );
        
        // Log explicitly when an action is taken
        log(`Activated room: ${document.$id}`);

        /*
        // Notification logic (legacy)
        var subscribersTokens = [];
        // ... (rest of the commented notification logic kept if needed for reference, 
        // essentially user logic seems to be to keep it commented for now as they didn't ask to implement it)
        */
      }
    }

    return res.json({
      message: 'Time check completed successfully'
    });

  } catch (err) {
    error(`Error in upcomingRoom-isTime-checker: ${err.message}`);
    return res.json({
      message: 'Error occurred during time check',
      error: err.message
    }, 500);
  }
};
