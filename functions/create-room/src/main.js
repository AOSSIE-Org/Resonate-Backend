import AppwriteService from "./appwrite.js";
import LivekitService from "./livekit.js";
import RoomCreationService from "./room-creation-service.js";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    // Validate environment variables
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "MASTER_DATABASE_ID",
        "ROOMS_COLLECTION_ID",
        "LIVEKIT_HOST",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "LIVEKIT_SOCKET_URL",
    ]);

    // Initialize services
    const appwriteService = new AppwriteService();
    const livekitService = new LivekitService();
    const roomCreationService = new RoomCreationService(
        appwriteService,
        livekitService,
        process.env.LIVEKIT_SOCKET_URL
    );

    // Parse and validate request body
    let requestBody;
    try {
        requestBody = JSON.parse(req.body);
        throwIfMissing(requestBody, ["name", "adminUid", "tags"]);
    } catch (err) {
        error(err.message);
        return res.json({ msg: err.message }, 400);
    }

    // Handle room creation
    try {
        log(req);
        const { name, description, adminUid, tags } = requestBody;

        // Delegate business logic to the service
        const result = await roomCreationService.createRoom({
            name,
            description,
            adminUid,
            tags,
        });

        log(`Room created: ${result.appwriteRoomId}`);

        // Format and return response
        return res.json({
            msg: "Room created Successfully",
            livekit_room: result.livekitRoom,
            livekit_socket_url: result.livekitSocketUrl,
            access_token: result.accessToken,
        });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Room creation failed" }, 500);
    }
};
