const sdk = require("node-appwrite");

const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require("./resonate-service-account.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const CALL_BLOCKING_STATUSES = ['dnd', 'inroom'];

function resolveRecieverUid(body) {
  if (body.recieverUid) return body.recieverUid;
  try {
    return JSON.parse(body.data?.extra ?? '{}').recieverUid ?? null;
  } catch (_) {
    return null;
  }
}

async function readPresenceStatus({ recieverUid, log, error }) {
  try {
    const client = new sdk.Client()
      .setEndpoint(
        process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
      )
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const database = new sdk.TablesDB(client);

    const row = await database.getRow({
      databaseId: process.env.UserDataDatabaseID,
      tableId: process.env.UsersCollectionID,
      rowId: recieverUid,
      queries: [sdk.Query.select(['$id', 'status'])]
    });

    return row.status ?? null;
  } catch (err) {
    // Includes a 404 for a reciever with no user row.
    error('Presence lookup failed, allowing the call: ' + err);
    return null;
  }
}

module.exports = async function ({ req, res, log, error }) {
  let body;
  try {
    body = JSON.parse(req.body);
  } catch (_) {
    return res.json({ message: 'Malformed request body' }, 400);
  }

  const { recieverFCMToken, data } = body;
  if (!recieverFCMToken) {
    return res.json({ message: 'Missing recieverFCMToken' }, 400);
  }

  const recieverUid = resolveRecieverUid(body);

  // Presence gate. This runs before the callee's device is ever rung and
  // before either side asks Join Room for a LiveKit token.
  if (recieverUid) {
    const status = await readPresenceStatus({ recieverUid, log, error });
    if (status && CALL_BLOCKING_STATUSES.includes(status)) {
      log(`Call to ${recieverUid} blocked by presence status: ${status}`);
      return res.json({
        blocked: true,
        reason: status,
        message: 'Reciever is not accepting calls'
      });
    }
  } else {
    log('No recieverUid in payload, skipping the presence check');
  }

  log("Send Notification");
  log(recieverFCMToken);
  log(data);

  const message = {
    data: data,
    token: recieverFCMToken,

    android: {
      priority: "high"
    }
  };

  try {
    const response = await getMessaging(app).send(message);
    log('Notifications were sent successfully, ' + JSON.stringify(response));
  } catch (err) {
    // Reported rather than thrown: the call row already exists and the caller
    // side handles a ring that never connects.
    error('Error sending message: ' + err);
    return res.json({
      blocked: false,
      delivered: false,
      message: 'Notification could not be delivered'
    });
  }

  return res.json({
    blocked: false,
    delivered: true,
    message: 'Notification sent'
  });
}
