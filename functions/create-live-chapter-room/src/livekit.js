import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

class LivekitService {
    constructor() {
        this.roomServiceClient = new RoomServiceClient(
            `${process.env.LIVEKIT_HOST}`,
            `${process.env.LIVEKIT_API_KEY}`,
            `${process.env.LIVEKIT_API_SECRET}`
        );
    }

    generateToken(roomName, participantUid, isRoomAdmin) {
        const accessToken = new AccessToken(
            `${process.env.LIVEKIT_API_KEY}`,
            `${process.env.LIVEKIT_API_SECRET}`,
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
    }

    async createRoom(roomOptions) {
        const newLivekitRoom =
            await this.roomServiceClient.createRoom(roomOptions);

        return newLivekitRoom;
    }
}

export default LivekitService;
