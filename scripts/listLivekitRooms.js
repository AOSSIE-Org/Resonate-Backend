import { RoomServiceClient } from "livekit-server-sdk";
import dotenv from "dotenv";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

svc.listRooms().then((rooms) => {
  console.log("Active LiveKit Rooms\n", rooms);
});
