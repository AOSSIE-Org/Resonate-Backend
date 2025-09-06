const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require("./resonate-service-account.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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
      priority: "high"
    }
  };
  await getMessaging(app).send(message)
    .then((response) => {

      log('Notifications were sent successfully, ' + JSON.stringify(response));

    }).catch((error) => {
      log('Error sending message:', error);
    });

  return res.json({
    message: 'Notification sent'
  });
}


