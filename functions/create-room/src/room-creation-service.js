import AppwriteService from "./appwrite.js";
import LivekitService from "./livekit.js";

/**
 * Service responsible for orchestrating room creation business logic.
 * Handles the creation of room metadata in Appwrite and LiveKit room setup.
 */
class RoomCreationService {
    constructor(appwriteService, livekitService, livekitSocketUrl) {
        this.appwrite = appwriteService;
        this.livekit = livekitService;
        this.livekitSocketUrl = livekitSocketUrl;
    }

    /**
     * Creates a new room with the provided details.
     * 
     * @param {Object} roomData - Room creation parameters
     * @param {string} roomData.name - Room name
     * @param {string} [roomData.description] - Room description (optional)
     * @param {string} roomData.adminUid - Admin user ID
     * @param {string[]} roomData.tags - Room tags
     * @returns {Promise<Object>} Room creation result with room details and access token
     * @throws {Error} If room creation fails
     */
    async createRoom({ name, description, adminUid, tags }) {
        // Create room metadata in Appwrite
        const roomMetadata = {
            name,
            description,
            adminUid,
            tags,
            totalParticipants: 1,
        };
        
        const appwriteRoomId = await this.appwrite.createRoom(roomMetadata);

        // Create LiveKit room using Appwrite room ID as the room name
        const livekitRoomOptions = {
            name: appwriteRoomId,
            emptyTimeout: 300, // timeout in seconds
        };
        
        const livekitRoom = await this.livekit.createRoom(livekitRoomOptions);

        // Generate access token for the admin
        const accessToken = this.livekit.generateToken(
            appwriteRoomId,
            adminUid,
            true // isRoomAdmin
        );

        return {
            livekitRoom,
            livekitSocketUrl: this.livekitSocketUrl,
            accessToken,
            appwriteRoomId,
        };
    }
}

export default RoomCreationService;
