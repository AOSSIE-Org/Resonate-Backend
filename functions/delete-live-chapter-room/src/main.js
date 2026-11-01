import { RoomServiceClient } from "livekit-server-sdk";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "LIVEKIT_HOST",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
    ]);



    const roomServiceClient = new RoomServiceClient(
        `${process.env.LIVEKIT_HOST}`,
        `${process.env.LIVEKIT_API_KEY}`,
        `${process.env.LIVEKIT_API_SECRET}`
    );

    try {
        throwIfMissing(JSON.parse(req.body), ["appwriteRoomDocId"]);
    } catch (err) {
        return res.json({ msg: err.message }, 400);
    }

    try {
        log(req);
        const { appwriteRoomDocId, } = JSON.parse(req.body);


        await roomServiceClient.deleteRoom(appwriteRoomDocId);
        return res.json({ msg: "Room deleted successfully" });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Room deletion failed" }, 500);
    }
};
