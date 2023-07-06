import { RoomServiceClient } from "livekit-server-sdk";
import { ID } from "node-appwrite";
import { db } from "../config/appwrite.js";
import { generateToken } from "./generateToken.js";
import { masterDatabaseId, roomsCollectionId } from "../constants/constants.js";
import dotenv from "dotenv";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

async function createAppwriteRoom(roomData) {
  const newRoomDocRef = await db.createDocument(
    masterDatabaseId,
    roomsCollectionId,
    ID.unique(),
    roomData
  );

  return newRoomDocRef.$id;
}

const createRoom = async (req, res) => {
  console.log("New Room Data: ", req.body);
  try {
    const roomName = req.body.name;
    const roomDescription = req.body.description;
    const roomAdminEmail = req.body.adminEmail;
    const roomTags = req.body.tags;

    // create a new room on appwrite
    const roomData = {
      name: roomName,
      description: roomDescription,
      adminEmail: roomAdminEmail,
      tags: roomTags,
      totalParticipants: 1,
    };
    let appwriteRoomDocId = await createAppwriteRoom(roomData);
    console.log(`Appwrite Room created - ${appwriteRoomDocId}`);

    // create a new livekit room
    const roomOptions = {
      name: appwriteRoomDocId, // using appwrite room doc id as livekit room name
      emptyTimeout: 60, // timeout in seconds
    };
    svc.createRoom(roomOptions).then((room) => {
      console.log(`LiveKit Room created - ${room}`);

      // Creating a token for the admin
      const token = generateToken(appwriteRoomDocId, roomAdminEmail, true);

      res.json({
        msg: "Room created Successfully",
        livekit_room: room,
        livekit_socket_url: `${process.env.LIVEKIT_SOCKET_URL}`,
        access_token: token,
      });
    });
  } catch (error) {
    console.log(error);
    res.statusCode;
    res.status(500).json({ msg: "Error" });
  }
};

export { createRoom };
