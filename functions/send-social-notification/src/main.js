const sdk = require("node-appwrite");

const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');

// Read from a project variable rather than `require`-ing a file. The file way
// (used by the other FCM functions) needs resonate-service-account.json copied
// into every function directory by hand — it is gitignored, so a fresh clone
// has none and the runtime dies at load with "Cannot find module".
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}');
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Pushes to ONE target user, unlike send-story-notification which fans out to a
// creator's followers. Used for like / follow / subscribe, where the person to
// notify is the subject of the action rather than an audience.
module.exports = async function ({ req, res, log, error }) {
  const client = new sdk.Client();
  const database = new sdk.TablesDB(client);
  const query = sdk.Query;

  let body;
  try {
    body = JSON.parse(req.body);
  } catch (e) {
    error('Bad request body');
    return res.json({ message: 'Invalid JSON body' }, 400);
  }

  const { targetUid, payload, data } = body;
  if (!targetUid || !payload) {
    return res.json({ message: 'targetUid and payload are required' }, 400);
  }

  client.setEndpoint(
    process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"]);

  const targetResult = await database.listRows({
    databaseId: process.env.UserDataDatabaseID,
    tableId: process.env.UsersCollectionID,
    queries: [query.equal('$id', [targetUid])]
  });

  if (targetResult.rows.length === 0) {
    log(`Target ${targetUid} not found`);
    return res.json({ message: 'Target not found' });
  }

  const tokens = targetResult.rows[0].fcmTokens;
  if (!Array.isArray(tokens) || tokens.length === 0) {
    log(`No FCM tokens for ${targetUid}, skipping.`);
    return res.json({ message: 'Nothing to notify.' });
  }

  // FCM rejects a data map containing anything but strings
  const stringData = {};
  for (const [k, v] of Object.entries(data ?? {})) {
    if (v !== null && v !== undefined) stringData[k] = String(v);
  }

  const message = {
    notification: payload,
    data: stringData,
    tokens: tokens,
    priority: "high",
    android: {
      priority: "high"
    }
  };

  const response = await getMessaging(app).sendEachForMulticast(message);
  if (response.failureCount > 0) {
    // A token goes stale when the app is reinstalled or data is cleared. Prune
    // those, otherwise every later send retries them forever.
    const stale = [];
    response.responses.forEach((r, i) => {
      const code = r.error?.code ?? '';
      if (code.includes('registration-token-not-registered') ||
          code.includes('invalid-registration-token') ||
          code.includes('invalid-argument')) {
        stale.push(tokens[i]);
      }
    });
    log(`${response.failureCount} send(s) failed, ${stale.length} token(s) stale`);

    if (stale.length > 0) {
      const kept = tokens.filter((t) => !stale.includes(t));
      try {
        await database.updateRow({
          databaseId: process.env.UserDataDatabaseID,
          tableId: process.env.UsersCollectionID,
          rowId: targetUid,
          data: { fcmTokens: kept }
        });
      } catch (e) {
        error(`Failed to prune stale tokens: ${e}`);
      }
    }
  }

  return res.json({
    message: 'Notification sent',
    sent: response.successCount,
    failed: response.failureCount
  });
}
