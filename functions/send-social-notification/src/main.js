const sdk = require("node-appwrite");

// Pushes to ONE target user
module.exports = async function ({ req, res, log, error }) {
  const client = new sdk.Client();
  const messaging = new sdk.Messaging(client);

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

  const stringData = {
    title: String(payload.title ?? ''),
    body: String(payload.body ?? '')
  };
  for (const [k, v] of Object.entries(data ?? {})) {
    if (v !== null && v !== undefined) stringData[k] = String(v);
  }

  try {
    const message = await messaging.createPush({
      messageId: sdk.ID.unique(),
      title: payload.title,
      body: payload.body,
      users: [targetUid],
      data: stringData,
      priority: 'high'
    });
    log(`Queued push ${message.$id} for ${targetUid}`);
    return res.json({ message: 'Notification sent', messageId: message.$id });
  } catch (e) {
    error(`Failed to send push to ${targetUid}: ${e}`);
    return res.json({ message: 'Notification not sent', reason: String(e) });
  }
}
