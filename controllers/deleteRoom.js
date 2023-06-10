import { RoomServiceClient, TokenVerifier } from "livekit-server-sdk";
import { db } from "../firebase.js";
import { doc, deleteDoc } from "firebase/firestore";
import dotenv from "dotenv";
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

const deleteRoom = async (req, res) =>{
  console.log("Deleting room with requested Data:", req.body);
  const firebaseRoomDocId = req.body.firebaseRoomDocId;
  const token = req.body.token;
  try {
    const isTokenValid = tokenVerifier.verify(token);
    if (
      isTokenValid.video.room === firebaseRoomDocId &&
      isTokenValid.video.roomCreate === true
    ) {

      //Delete Firebase room doc
      await deleteDoc(doc(db, "rooms", firebaseRoomDocId));
      console.log("Firebase Room Doc deleted");

      // Delete livekit room
      svc.deleteRoom(firebaseRoomDocId).then(() => {
        console.log("Livekit Room deleted:", firebaseRoomDocId);
        res.json({ msg: "Success" });
      });
    }
  } catch (e) {
    console.log("Error occured while deleting Room :", e);
    res.status(400).json({ msg: "Invalid Token" });
  }
};

export { deleteRoom };
