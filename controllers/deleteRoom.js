import { RoomServiceClient, TokenVerifier } from "livekit-server-sdk";
import { db } from "../config/appwrite.js";
import {
  masterDatabaseId,
  roomsCollectionId,
  participantsCollectionId,
} from "../constants/constants.js";
import dotenv from "dotenv";
import { Query } from "node-appwrite";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

const tokenVerifier = new TokenVerifier(
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

async function deleteAppwriteRoom(roomDocId) {
  // Deleting room doc inside rooms collection in master database
  await db.deleteDocument(masterDatabaseId, roomsCollectionId, roomDocId);

  // Removing participants from collection
  var participantColRef = await db.listDocuments(
    masterDatabaseId,
    participantsCollectionId,
    [Query.equal("roomId", [roomDocId])]
  );
  participantColRef.documents.forEach(async (participant) => {
    await db.deleteDocument(
      masterDatabaseId,
      participantsCollectionId,
      participant.$id
    );
  });

  console.log("Appwrite Room deleted");
}

const deleteRoom = async (req, res) => {
  console.log("Deleting room with requested Data:", req.body);
  const appwriteRoomDocId = req.body.appwriteRoomDocId;
  const token = req.body.token;
  try {
    const isTokenValid = tokenVerifier.verify(token);
    if (
      isTokenValid.video.room === appwriteRoomDocId &&
      isTokenValid.video.roomCreate === true
    ) {
      //Delete Appwrite room doc
      await deleteAppwriteRoom(appwriteRoomDocId);

      // Delete livekit room
      svc.deleteRoom(appwriteRoomDocId).then(() => {
        console.log("Livekit Room deleted:", appwriteRoomDocId);
        res.json({ msg: "Success" });
      });
    }
  } catch (e) {
    console.log("Error occured while deleting Room :", e);
    res.status(400).json({ msg: "Invalid Token or Server Error" });
  }
};

export { deleteRoom };
