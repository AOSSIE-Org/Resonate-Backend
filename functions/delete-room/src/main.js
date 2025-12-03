const { Client, Databases, Query } = require("node-appwrite");
const { throwIfMissing } = require("./utils.js");
const { RoomServiceClient } = require("livekit-server-sdk");

module.exports = async ({ req, res, log, error }) => {
  throwIfMissing(process.env, [
    "APPWRITE_API_KEY",
    "MASTER_DATABASE_ID",
    "ROOMS_COLLECTION_ID",
    "PARTICIPANTS_COLLECTION_ID",
    "LIVEKIT_HOST",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
  ]);

  const databases = new Databases(
    new Client()
      .setEndpoint(
        process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY)
  );

  const roomServiceClient = new RoomServiceClient(
    `${process.env.LIVEKIT_HOST}`,
    `${process.env.LIVEKIT_API_KEY}`,
    `${process.env.LIVEKIT_API_SECRET}`
  );

  try {
    const { appwriteRoomDocId } = JSON.parse(req.body);
    throwIfMissing({ appwriteRoomDocId }, ["appwriteRoomDocId"]);

    const appwriteRoom = await databases.getDocument(
      process.env.MASTER_DATABASE_ID,
      process.env.ROOMS_COLLECTION_ID,
      appwriteRoomDocId
    );

    const roomAdminUid = req.headers["x-appwrite-user-id"];
    if (appwriteRoom.adminUid !== roomAdminUid) {
      log("User not room admin");
      return res.json({ msg: "User is not room admin" }, 403);
    }

    await databases.deleteDocument(
      process.env.MASTER_DATABASE_ID,
      process.env.ROOMS_COLLECTION_ID,
      appwriteRoomDocId
    );

    const participantColRef = await databases.listDocuments(
      process.env.MASTER_DATABASE_ID,
      process.env.PARTICIPANTS_COLLECTION_ID,
      [Query.equal("roomId", [appwriteRoomDocId])]
    );
    log(participantColRef);
    for (const participant of participantColRef.documents) {
      await databases.deleteDocument(
        process.env.MASTER_DATABASE_ID,
        process.env.PARTICIPANTS_COLLECTION_ID,
        participant.$id
      );
    }
    await roomServiceClient.deleteRoom(appwriteRoomDocId);
    return res.json({ msg: "Room deleted successfully" });
  } catch (e) {
    error(String(e));
    return res.json({ msg: "Room deletion failed" }, 500);
  }
};
