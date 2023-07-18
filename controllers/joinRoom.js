import { generateToken } from "./generateToken.js";
import dotenv from "dotenv";
dotenv.config();

const joinRoom = async (req, res) => {
  //TODO: verify if the user with uid has requested for a token.
  try {
    console.log("Request Data: ", req.body);
    const roomName = req.body.roomName;
    const uid = req.body.uid;
    // Creating a token for the user
    const token = generateToken(roomName, uid, false);
    res.json({
      msg: "Success",
      livekit_socket_url: `${process.env.LIVEKIT_SOCKET_URL}`,
      access_token: token,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Error" });
  }
};

export { joinRoom };
