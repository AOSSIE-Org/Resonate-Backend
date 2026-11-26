import { Client, Databases, Query, ID } from "node-appwrite";

class AppwriteService {
    constructor() {
        const client = new Client();
        client
            .setEndpoint(
                process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
            )
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);
        
        this.databases = new Databases(client);
        this.databaseId = process.env.MASTER_DATABASE_ID;
        this.roomsTableId = process.env.ROOMS_TABLE_ID;
        this.messagesTableId = process.env.MESSAGES_TABLE_ID;
    }

    async verifyRoomParticipant(roomId, userId) {
        try {
            // Check if room exists
            const room = await this.databases.getDocument(
                this.databaseId,
                this.roomsTableId,
                roomId
            );

            if (!room) {
                return false;
            }

            // Check if user is admin or participant
            const isAdmin = room.adminUid === userId;
            const participants = room.participants || [];
            const isParticipant = participants.includes(userId);

            return isAdmin || isParticipant;
        } catch (error) {
            console.error('Error verifying room participant:', error);
            return false;
        }
    }

    async verifyModeratorPermission(roomId, userId) {
        try {
            const room = await this.databases.getDocument(
                this.databaseId,
                this.roomsTableId,
                roomId
            );

            return room.adminUid === userId;
        } catch (error) {
            console.error('Error verifying moderator permission:', error);
            return false;
        }
    }

    async createMessage(messageData) {
        try {
            const messageId = ID.unique();
            const message = {
                roomId: messageData.roomId,
                senderId: messageData.senderId,
                content: messageData.content,
                timestamp: messageData.timestamp,
                isDeleted: false,
                editedAt: null,
                replyTo: messageData.replyTo || null
            };

            const result = await this.databases.createDocument(
                this.databaseId,
                this.messagesTableId,
                messageId,
                message
            );

            return { ...result, $id: messageId };
        } catch (error) {
            console.error('Error creating message:', error);
            throw new Error('Failed to create message');
        }
    }

    async getMessageHistory(roomId, limit = 50) {
        try {
            const result = await this.databases.listDocuments(
                this.databaseId,
                this.messagesTableId,
                [
                    Query.equal('roomId', roomId),
                    Query.equal('isDeleted', false),
                    Query.orderDesc('timestamp'),
                    Query.limit(limit)
                ]
            );

            return result.documents.reverse(); // Return in chronological order
        } catch (error) {
            console.error('Error getting message history:', error);
            throw new Error('Failed to retrieve message history');
        }
    }

    async getMessage(messageId) {
        try {
            const message = await this.databases.getDocument(
                this.databaseId,
                this.messagesTableId,
                messageId
            );
            return message;
        } catch (error) {
            console.error('Error getting message:', error);
            throw new Error('Message not found');
        }
    }

    async updateMessage(messageId, updates) {
        try {
            const result = await this.databases.updateDocument(
                this.databaseId,
                this.messagesTableId,
                messageId,
                updates
            );
            return result;
        } catch (error) {
            console.error('Error updating message:', error);
            throw new Error('Failed to update message');
        }
    }

    async deleteMessage(messageId) {
        try {
            await this.databases.updateDocument(
                this.databaseId,
                this.messagesTableId,
                messageId,
                { isDeleted: true }
            );
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw new Error('Failed to delete message');
        }
    }

    async getRoom(roomId) {
        try {
            const room = await this.databases.getDocument(
                this.databaseId,
                this.roomsTableId,
                roomId
            );
            return room;
        } catch (error) {
            console.error('Error getting room:', error);
            throw new Error('Room not found');
        }
    }

    async addMutedUser(roomId, userId, duration = 300000) { // 5 minutes default
        try {
            const room = await this.getRoom(roomId);
            const mutedUsers = room.mutedUsers || {};
            
            mutedUsers[userId] = {
                mutedAt: Date.now(),
                mutedUntil: Date.now() + duration,
                mutedBy: 'system' // Could be moderator ID
            };

            await this.databases.updateDocument(
                this.databaseId,
                this.roomsTableId,
                roomId,
                { mutedUsers }
            );

            return true;
        } catch (error) {
            console.error('Error muting user:', error);
            throw new Error('Failed to mute user');
        }
    }

    async removeMutedUser(roomId, userId) {
        try {
            const room = await this.getRoom(roomId);
            const mutedUsers = room.mutedUsers || {};
            
            delete mutedUsers[userId];

            await this.databases.updateDocument(
                this.databaseId,
                this.roomsTableId,
                roomId,
                { mutedUsers }
            );

            return true;
        } catch (error) {
            console.error('Error unmuting user:', error);
            throw new Error('Failed to unmute user');
        }
    }

    async getMutedUsers(roomId) {
        try {
            const room = await this.getRoom(roomId);
            return room.mutedUsers || {};
        } catch (error) {
            console.error('Error getting muted users:', error);
            return {};
        }
    }
}

export default AppwriteService;