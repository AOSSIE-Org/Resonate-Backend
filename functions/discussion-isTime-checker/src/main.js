const sdk = require("node-appwrite");

const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require("./resonate-service-account.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = async function ({req, res, log}) {
var subscribersTokens = [];
  const client = new sdk.Client();
  const database = new sdk.Databases(client);
  const query = sdk.Query;
  log("here");
  client.setEndpoint(
      process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
  log(process.env.APPWRITE_FUNCTION_PROJECT_ID);
  log("here also");
let discussionList = await database.listDocuments(process.env.DiscussionsDataBaseID, process.env.DiscussionCollectionID);
log("here as well");
for (const document of discussionList.documents){
  log("now here");
  var scheduledDateTime =  document["scheduledDateTime"];
  log(scheduledDateTime);
  var splittedDateTime = scheduledDateTime.split('T');
  var extractedDate = splittedDateTime[0];
  var extractedTime = splittedDateTime[1];
  var SplittingDate = extractedDate.split("-");
  const year = Number(SplittingDate[0]);
  const month = Number(SplittingDate[1]);
  const day = Number(SplittingDate[2]);
  var SplittingTime = extractedTime.split(":");
  const hour = Number(SplittingTime[0]);
  const minutes = Number(SplittingTime[1]);
  const discussionDate = Date.UTC(year, month-1, day, hour, minutes);
  log(discussionDate);
  const now = new Date();
  const nowTime = now.getTime();
  log(nowTime);
  var timeLeft = discussionDate - nowTime;
  var timeLeftInMinutes = timeLeft / (1000 * 60);
  log(timeLeftInMinutes);
  if (timeLeftInMinutes <= 5 && timeLeftInMinutes >= 0){
    await database.updateDocument(process.env.DiscussionsDataBaseID, process.env.DiscussionCollectionID, document.$id, {
      "isTime": true
    })
    log("Send Notification");
    let subscriberList = await database.listDocuments(process.env.DiscussionsDataBaseID, process.env.SubscriberCollectionID, [query.equal('discussionID', [document.$id])]);
    log("here as well")
    subscriberList.documents.forEach(subscriber=>{
      for(const token of subscriber["registrationTokens"]){
        subscribersTokens.push(token);
      }
    });
    log(subscribersTokens);
    const message = {
      notification: {
        title: 'Room Reminder',
        body: `The room ${document["name"]} will Start Soon`
      },
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
  }
}
return res.json({
    message: 'set verified'
  });
};
