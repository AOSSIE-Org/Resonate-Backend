import { RoomServiceClient } from "livekit-server-sdk";
import dotenv from "dotenv";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

const createRoom = (req, res) => {
  console.log("Requested Room Data:", req.body);
  try {
    // list rooms
    svc.listRooms().then((rooms) => {
      console.log("existing rooms", rooms);
    });

    // create a new room
    const roomName = req.body.roomName;
    const opts = {
      name: roomName,
      // timeout in seconds
      emptyTimeout: 10 * 60,
      maxParticipants: 20,
    };
    svc.createRoom(opts).then((room) => {
      console.log("room created", room);
      res.json({ msg: "Room created Successfully", room: room });
    });
  } catch (error) {
    console.log(error);
    res.json({ msg: "Error creating room" });
  }
};

export { createRoom };
