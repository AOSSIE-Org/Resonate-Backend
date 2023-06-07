//livekit-server-sdk imports
import { RoomServiceClient } from "livekit-server-sdk";
const livekitHost = "https://my.livekit.host";
const svc = new RoomServiceClient(
  livekitHost,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

const deleteRoom = (req, res) => {
  console.log("Deleting room with requested Data:", req.body);
  const roomName = req.body.roomName;
  try {
    svc.deleteRoom(roomName).then(() => {
      console.log("Room deleted:", roomName);
    });
  } catch (e) {
    console.log("Error occured while deleting Room :", e);
    res.json({ msg: "Error deleting room" });
  }
};

export { deleteRoom };
