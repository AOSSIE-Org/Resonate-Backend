import { RoomServiceClient } from "livekit-server-sdk";
import { db } from "../firebase.js";
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

async function createFirebaseRoom(roomData) {
  const roomsCollectionRef = collection(db, "rooms");
  const newRoomDocRef = await addDoc(roomsCollectionRef, roomData);
  await setDoc(
    doc(db, "rooms", newRoomDocRef.id, "participants",roomData.admin_username ),
    {
      isAdmin: true,
      isModerator: true,
      isSpeaker: true,
      isMicOn: false,
    }
  );
  return newRoomDocRef.id;
}

const createRoom = async (req, res) => {
  console.log("Requested Room Data:", req.body);
  try {
    // list rooms
    svc.listRooms().then((rooms) => {
      console.log("existing rooms", rooms);
    });

    const roomName = req.body.name;
    const roomDescription = req.body.description;
    const roomAdminUsername = req.body.admin_username;
    const roomTags = req.body.tags;

    // create a new livekit room
    const opts = {
      name: roomName,
      // timeout in seconds
      emptyTimeout: 60,
      maxParticipants: 20,
    };
    svc.createRoom(opts).then((room) => {
      console.log("room created", room);
      res.json({ msg: "Room created Successfully", room: room });
    });

    // create a new room document on firebase
    const roomData = {
      name: roomName,
      description: roomDescription,
      admin_username: roomAdminUsername,
      tags: roomTags,
      total_participants: 1,
    };
    let firebaseRoomDocId = await createFirebaseRoom(roomData);
    console.log(firebaseRoomDocId);
  } catch (error) {
    console.log(error);
    res.json({ msg: "Error creating room" });
  }
};

export { createRoom };
