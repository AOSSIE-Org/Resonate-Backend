import { RoomServiceClient } from "livekit-server-sdk";
import { db } from "../config/appwrite.js";
import {
  masterDatabaseId,
  roomsCollectionId,
  participantsCollectionId,
} from "../constants/constants.js";
import { verifyAppwriteToken } from "./verifyAppwriteToken.js";
import dotenv from "dotenv";
import { Query } from "node-appwrite";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
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
  const appwriteUser = await verifyAppwriteToken(req.headers.authorization);
  if (appwriteUser === null) {
    res.status(403).json({ msg: "Invalid Token" });
    return;
  }

  console.log("Deleting room with requested Data:", req.body);
  const appwriteRoomDocId = req.body.appwriteRoomDocId;
  const livekitToken = req.body.token; //If required in future
  const roomAdminUid = appwriteUser.$id;

  try {
    const appwriteRoomDocument = await db.getDocument(
      masterDatabaseId,
      roomsCollectionId,
      appwriteRoomDocId
    );
    if (appwriteRoomDocument.adminUid != roomAdminUid) {
      console.log("User not room admin");
      return res.status(403).json({ msg: "User not room admin" });
    } else {
      //Delete Appwrite room doc
      await deleteAppwriteRoom(appwriteRoomDocId);

      // Delete livekit room
      await svc.deleteRoom(appwriteRoomDocId);
      console.log("Livekit Room deleted:", appwriteRoomDocId);
      res.json({ msg: "Success" });
    }
  } catch (e) {
    console.log("Error occured while deleting Room :", e);
    res.status(500).json({ msg: "Server Error" });
  }
};

export { deleteRoom };
