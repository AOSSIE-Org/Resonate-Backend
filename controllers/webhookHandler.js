import { WebhookReceiver } from "livekit-server-sdk";

import { masterDatabaseId, roomsCollectionId } from "../constants/constants.js";
import { deleteAppwriteRoom } from "./deleteRoom.js";
import { db } from "../config/appwrite.js";

const receiver = new WebhookReceiver(
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

const webhookHandler = async (req, res) => {
  try {
    const event = receiver.receive(req.body, req.get("Authorization"));
    console.log("Webhook called", event.event, event.room.sid);

    if (event.event === "room_finished") {
      console.log("Room finished", event.room.name);

      // Appwrite room id is same as Livekit room name
      const appwriteRoomDocId = event.room.name;

      // Delete the room in appwrite if it still exists
      const appwriteRoomDocument = await db.getDocument(
        masterDatabaseId,
        roomsCollectionId,
        appwriteRoomDocId
      );
      if (appwriteRoomDocument) {
        deleteAppwriteRoom(appwriteRoomDocId);
      }
    }
  } catch (e) {
    console.log("Webhhok error", e);
  }
};

export { webhookHandler };
