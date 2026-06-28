import { Client, Databases, Query } from "node-appwrite";
import { generateToken } from "./livekit.js";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "MASTER_DATABASE_ID",
        "ROOMS_COLLECTION_ID",
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

        const databases = new Databases(
            new Client()
                .setEndpoint(
                    process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
                )
                .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
                .setKey(process.env.APPWRITE_API_KEY)
        );

        const rooms = await databases.listDocuments(
            process.env.MASTER_DATABASE_ID,
            process.env.ROOMS_COLLECTION_ID,
            [Query.equal("name", roomName)]
        );
        const roomExists = rooms.documents.length > 0;

        if (!roomExists) {
            return res.json({ msg: "Room not found" }, 404);
        }

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
