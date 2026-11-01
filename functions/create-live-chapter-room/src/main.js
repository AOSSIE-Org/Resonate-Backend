import LivekitService from "./livekit.js";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "LIVEKIT_HOST",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "LIVEKIT_SOCKET_URL",
    ]);

    const livekit = new LivekitService();

    try {
        throwIfMissing(JSON.parse(req.body), ["appwriteRoomId", "adminUid"]);
    } catch (err) {
        error(err.message);
        return res.json({ msg: err.message }, 400);
    }

    try {
        log(req);
        const { appwriteRoomId, adminUid } = JSON.parse(req.body);

        // create a new livekit room
        const livekitRoomOptions = {
            name: appwriteRoomId, // using appwrite room doc id as livekit room name
            emptyTimeout: 300, // timeout in seconds
        };
        const livekitRoom = await livekit.createRoom(livekitRoomOptions);
        log(livekitRoom);

        // Creating a token for the admin
        const accessToken = livekit.generateToken(
            appwriteRoomId,
            adminUid,
            true
        );

        return res.json({
            msg: "Room created Successfully",
            livekit_room: livekitRoom,
            livekit_socket_url: `${process.env.LIVEKIT_SOCKET_URL}`,
            access_token: accessToken,
        });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Room creation failed" }, 500);
    }
};
