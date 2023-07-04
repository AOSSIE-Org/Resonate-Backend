import { RoomServiceClient } from "livekit-server-sdk";
import { ID } from "node-appwrite";
import { db } from "../config/appwrite.js";
import { generateToken } from "./generateToken.js";
import dotenv from "dotenv";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

async function createAppwriteRoom(roomData) {
  const newRoomDocRef = await db.createDocument(
    "master",
    "rooms",
    ID.unique(),
    roomData
  );
  const newRoomDatabaseId = newRoomDocRef.$id;

  // Creating a new database for the newly created room
  await db.create(newRoomDatabaseId, roomData.name);

  // Creating a participant collection inside the new room specific database
  await db.createCollection(newRoomDatabaseId, "participants", "participants");

  // Adding required attributes to the participants collection
  await db.createBooleanAttribute(
    newRoomDatabaseId,
    "participants",
    "isAdmin",
    true
  );
  await db.createBooleanAttribute(
    newRoomDatabaseId,
    "participants",
    "isModerator",
    true
  );
  await db.createBooleanAttribute(
    newRoomDatabaseId,
    "participants",
    "isSpeaker",
    true
  );
  await db.createBooleanAttribute(
    newRoomDatabaseId,
    "participants",
    "isMicOn",
    true
  );

  // Polling until all the required attributes are added to the collection
  while (true) {
    let participantCollection = await db.getCollection(
      newRoomDatabaseId,
      "participants"
    );
    let attributesAvailable = true;
    participantCollection.attributes.forEach((attribute) => {
      if (attribute.status != "available") {
        attributesAvailable = false;
      }
    });
    if (attributesAvailable === true) {
      break;
    }
  }

  // Creating a document for the admin inside participants collection linked to the room
  await db.createDocument(
    newRoomDatabaseId,
    "participants",
    roomData.admin_username,
    {
      isAdmin: true,
      isModerator: true,
      isSpeaker: true,
      isMicOn: false,
    }
  );

  return newRoomDocRef.$id;
}

const createRoom = async (req, res) => {
  console.log("New Room Data: ", req.body);
  try {
    const roomName = req.body.name;
    const roomDescription = req.body.description;
    const roomAdminUsername = req.body.admin_username;
    const roomTags = req.body.tags;

    // create a new room on appwrite
    const roomData = {
      name: roomName,
      description: roomDescription,
      admin_username: roomAdminUsername,
      tags: roomTags,
      total_participants: 1,
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
      const token = generateToken(appwriteRoomDocId, roomAdminUsername, true);

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
