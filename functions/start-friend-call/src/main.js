const sdk = require("node-appwrite");

const CALL_BLOCKING_STATUSES = ['dnd', 'inroom'];

function resolveRecieverUid(body) {
  if (body.recieverUid) return body.recieverUid;
  try {
    return JSON.parse(body.data?.extra ?? '{}').recieverUid ?? null;
  } catch (_) {
    return null;
  }
}

async function readPresenceStatus({ recieverUid, apiKey, log, error }) {
  try {
    const client = new sdk.Client()
      .setEndpoint(
        process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
      )
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(apiKey);
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

  const { data } = body;
  const recieverUid = resolveRecieverUid(body);
  if (!recieverUid) {
    return res.json({ message: 'Missing recieverUid' }, 400);
  }

  // Presence gate. This runs before the callee's device is ever rung and
  // before either side asks Join Room for a LiveKit token.
  {
    const status = await readPresenceStatus({
      recieverUid,
      apiKey: req.headers["x-appwrite-key"],
      log,
      error
    });
    if (status && CALL_BLOCKING_STATUSES.includes(status)) {
      log(`Call to ${recieverUid} blocked by presence status: ${status}`);
      return res.json({
        blocked: true,
        reason: status,
        message: 'Reciever is not accepting calls'
      });
    }
  }

  log(`Sending incoming-call push to ${recieverUid}`);

  const stringData = {};
  for (const [k, v] of Object.entries(data ?? {})) {
    if (v !== null && v !== undefined) stringData[k] = String(v);
  }

  try {
    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers["x-appwrite-key"]);
    const messaging = new sdk.Messaging(client);

    const response = await messaging.createPush({
      messageId: sdk.ID.unique(),
      title: stringData.caller_name || 'Incoming call',
      body: 'Incoming call',
      users: [recieverUid],
      data: stringData,
      priority: 'high'
    });
    log('Notification queued, ' + JSON.stringify(response.$id));
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
