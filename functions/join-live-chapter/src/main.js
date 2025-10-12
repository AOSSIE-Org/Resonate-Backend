import { generateToken } from "./livekit.js";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "LIVEKIT_SOCKET_URL",
    ]);

    try {
        throwIfMissing(JSON.parse(req.body), ["roomName", "uid"]);
    } catch (err) {
        return res.json({ msg: err.message }, 400);
    }

    try {
        log(req);
        const { roomName, uid: userId } = JSON.parse(req.body);

        const accessToken = generateToken(process.env, roomName, userId, false);

        return res.json({
            msg: "Success",
            livekit_socket_url: `${process.env.LIVEKIT_SOCKET_URL}`,
            access_token: accessToken,
        });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Error joining room" }, 500);
    }
};
