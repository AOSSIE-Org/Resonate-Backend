const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const serviceAccount = require("./resonate-service-account.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = async function ({ req, res, log, error }) {
  const { recieverFCMToken, data } = JSON.parse(req.body);

  log("Send Notification");
  log(recieverFCMToken);
  log(data);

  const message = {
    data: data,
    token: recieverFCMToken,

    android: {
      priority: "high",
    },
  };
  try {
    const response = await getMessaging(app).send(message);
    log("Notifications were sent successfully, " + JSON.stringify(response));
    return res.json({
      message: "Notification sent",
    });
  } catch (err) {
    log("Error sending message: " + JSON.stringify(err));
    return res.json(
      {
        message: "Failed to send notification",
        error: err.message,
      },
      500
    );
  }

};
