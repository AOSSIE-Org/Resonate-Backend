//livekit-server-sdk imports
import { AccessToken } from "livekit-server-sdk";

const generateToken = (roomName, participantUid, isRoomAdmin) => {
  //creating a new access token for the participant.
  try {
    const at = new AccessToken(
      `${process.env.LIVEKIT_API_KEY}`,
      `${process.env.LIVEKIT_API_SECRET}`,
      {
        identity: participantUid,
      }
    );

    //adding permissions to the access token before converting to jwt
    at.addGrant({
      room: roomName,
      roomCreate: isRoomAdmin,
      roomAdmin: isRoomAdmin,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      roomList: true,
    });
    //converting to JWT
    const token = at.toJwt();
    console.log("Access token - ", token);
    return token
  } catch (error) {
    console.log(error);
  }
};

export { generateToken };
