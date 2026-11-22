const sdk = require("node-appwrite");

module.exports = async function ({ req, res, log, error }) {
  var followerUids = [];
  const client = new sdk.Client();
  const database = new sdk.TablesDB(client);
  const query = sdk.Query;
  const { creatorId, payload } = JSON.parse(req.body);

  client.setEndpoint(
    process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"]);
  log(process.env.APPWRITE_FUNCTION_PROJECT_ID);

  log("Send Notification");
  log(creatorId);
  log(payload);
  let creatorResult = await database.listRows({ 
    databaseId: process.env.UserDataDatabaseID,
    tableId: process.env.UsersCollectionID,
    queries: [query.equal('$id', [creatorId])]
  });
  
  if (creatorResult.rows.length === 0) {
    log('Creator not found');
    return res.json({ message: 'Creator not found' });
  }
  
  let creatorDoc = creatorResult.rows[0];
  log("Creator document retrieved");

  // Followers are addressed by account, not by device: Appwrite Messaging
  // fans out to each user's own push subscription.
  if (creatorDoc.followers && Array.isArray(creatorDoc.followers)) {
    creatorDoc.followers.forEach(follower => {
      if (follower.followerUserId) {
        followerUids.push(follower.followerUserId);
      }
    });
  }

  log(followerUids);

  if (followerUids.length === 0) {
    log('No followers found, skipping notification.');
    return res.json({ message: 'No followers to notify.' });
  }

  const messaging = new sdk.Messaging(client);
  try {
    const response = await messaging.createPush({
      messageId: sdk.ID.unique(),
      title: payload?.title,
      body: payload?.body,
      users: followerUids,
      data: {
        title: String(payload?.title ?? ''),
        body: String(payload?.body ?? '')
      },
      priority: 'high'
    });
    log('Notification queued ' + response.$id);
  } catch (e) {
    // The story is already published; a failed push must not fail the upload.
    error('Error sending notification: ' + e);
    return res.json({ message: 'Notification not sent', reason: String(e) });
  }

  return res.json({
    message: 'Notification sent'
  });
}


