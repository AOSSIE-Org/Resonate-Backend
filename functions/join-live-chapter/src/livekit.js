import { AccessToken } from "livekit-server-sdk";

export const generateToken = (env, roomName, participantUid, isRoomAdmin) => {
    const accessToken = new AccessToken(
        env.LIVEKIT_API_KEY,
        env.LIVEKIT_API_SECRET,
        {
            identity: participantUid,
        }
    );

    //adding permissions to the access token before converting to jwt
    accessToken.addGrant({
        room: roomName,
        roomCreate: isRoomAdmin,
        roomAdmin: isRoomAdmin,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
        roomList: true,
    });

    //Return the JWT
    return accessToken.toJwt();
};
