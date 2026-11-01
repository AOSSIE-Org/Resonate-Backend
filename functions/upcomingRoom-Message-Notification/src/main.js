const sdk = require("node-appwrite");

module.exports = async function ({ req, res, log, error }) {
  var subscribersTokens = [];
  const client = new sdk.Client();
  const database = new sdk.TablesDB(client);
  const query = sdk.Query;
  const { roomId, payload } = JSON.parse(req.body);

  client.setEndpoint(
    process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"]);
  log(process.env.APPWRITE_FUNCTION_PROJECT_ID);

  log("Send Notification");
  log(roomId);
  log(payload);
  let subscriberList = await database.listRows({
    databaseId: process.env.UpcomingRoomsDataBaseID,
    tableId: process.env.SubscriberCollectionID,
    queries: [query.equal('upcomingRoomId', [roomId])]
  });
  log("here as well")
  subscriberList.rows.forEach(subscriber => {
    if (subscriber["userID"]) subscribersTokens.push(subscriber["userID"]);
  });
  let documentResult = await database.listRows({
    databaseId: process.env.UpcomingRoomsDataBaseID,
    tableId: process.env.UpcomingRoomsCollectionID,
    queries: [query.equal('$id', [roomId])]
  });
  
  if (documentResult.rows.length === 0) {
    log('Room not found');
    return res.json({ message: 'Room not found' });
  }
  
  let document = documentResult.rows[0];
  if (document["creatorUid"]) subscribersTokens.push(document["creatorUid"]);
  log(subscribersTokens);
  const recipients = [...new Set(subscribersTokens)];
  if (recipients.length === 0) {
    log('Nobody to notify for this room.');
    return res.json({ message: 'No subscribers to notify.' });
  }

  const messaging = new sdk.Messaging(client);
  try {
    const response = await messaging.createPush({
      messageId: sdk.ID.unique(),
      title: payload?.title,
      body: payload?.body,
      users: recipients,
      data: {
        title: String(payload?.title ?? ''),
        body: String(payload?.body ?? '')
      },
      priority: 'high'
    });
    log('Notification queued ' + response.$id);
  } catch (e) {
    error('Error sending notification: ' + e);
    return res.json({ message: 'Notification not sent', reason: String(e) });
  }

  return res.json({
    message: 'Notification sent'
  });
}


