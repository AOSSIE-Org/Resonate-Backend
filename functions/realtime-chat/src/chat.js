import AppwriteService from './appwrite.js';

class ChatService {
    constructor() {
        this.appwrite = new AppwriteService();
    }

    async createMessage(messageData) {
        try {
            // Validate message content
            this.validateMessageContent(messageData.content);

            // Create message in database
            const message = await this.appwrite.createMessage({
                roomId: messageData.roomId,
                senderId: messageData.senderId,
                content: messageData.content.trim(),
                timestamp: messageData.timestamp,
                replyTo: messageData.replyTo
            });

            // Add sender information for client
            const senderInfo = await this.getUserInfo(messageData.senderId);
            
            return {
                id: message.$id,
                roomId: message.roomId,
                senderId: message.senderId,
                content: message.content,
                timestamp: message.timestamp,
                sender: senderInfo,
                isDeleted: message.isDeleted,
                editedAt: message.editedAt,
                replyTo: message.replyTo
            };
        } catch (error) {
            console.error('Error creating message:', error);
            throw new Error('Failed to create message');
        }
    }

    async getMessageHistory(roomId, limit = 50) {
        try {
            const messages = await this.appwrite.getMessageHistory(roomId, limit);
            
            // Enrich messages with sender information
            const enrichedMessages = await Promise.all(
                messages.map(async (message) => {
                    const senderInfo = await this.getUserInfo(message.senderId);
                    return {
                        id: message.$id,
                        roomId: message.roomId,
                        senderId: message.senderId,
                        content: message.content,
                        timestamp: message.timestamp,
                        sender: senderInfo,
                        isDeleted: message.isDeleted,
                        editedAt: message.editedAt,
                        replyTo: message.replyTo
                    };
                })
            );

            return enrichedMessages;
        } catch (error) {
            console.error('Error getting message history:', error);
            throw new Error('Failed to retrieve message history');
        }
    }

    async deleteMessage(messageId, userId) {
        try {
            // Get message to verify ownership
            const message = await this.appwrite.getMessage(messageId);
            
            if (!message) {
                throw new Error('Message not found');
            }

            // Check if user is sender or moderator
            const room = await this.appwrite.getRoom(message.roomId);
            const isModerator = room.adminUid === userId;
            const isSender = message.senderId === userId;

            if (!isModerator && !isSender) {
                throw new Error('Insufficient permissions to delete message');
            }

            // Soft delete the message
            await this.appwrite.deleteMessage(messageId);
            
            return { success: true, messageId };
        } catch (error) {
            console.error('Error deleting message:', error);
            throw new Error('Failed to delete message');
        }
    }

    async canDeleteMessage(messageId, userId, roomId) {
        try {
            const message = await this.appwrite.getMessage(messageId);
            const room = await this.appwrite.getRoom(roomId);
            
            if (!message || !room) {
                return false;
            }

            // User can delete their own messages
            if (message.senderId === userId) {
                return true;
            }

            // Moderators can delete any message
            if (room.adminUid === userId) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking delete permission:', error);
            return false;
        }
    }

    async isUserMuted(roomId, userId) {
        try {
            const mutedUsers = await this.appwrite.getMutedUsers(roomId);
            const userMuteInfo = mutedUsers[userId];

            if (!userMuteInfo) {
                return false;
            }

            // Check if mute has expired
            const now = Date.now();
            if (userMuteInfo.mutedUntil && now > userMuteInfo.mutedUntil) {
                // Remove expired mute
                await this.appwrite.removeMutedUser(roomId, userId);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking user mute status:', error);
            return false;
        }
    }

    async moderateMessage(messageId, action, moderatorId) {
        try {
            const message = await this.appwrite.getMessage(messageId);
            
            if (!message) {
                throw new Error('Message not found');
            }

            switch (action) {
                case 'delete':
                    return await this.deleteMessage(messageId, moderatorId);
                
                case 'mute-user':
                    await this.appwrite.addMutedUser(message.roomId, message.senderId);
                    return { success: true, action: 'user-muted', userId: message.senderId };
                
                case 'unmute-user':
                    await this.appwrite.removeMutedUser(message.roomId, message.senderId);
                    return { success: true, action: 'user-unmuted', userId: message.senderId };
                
                default:
                    throw new Error('Invalid moderation action');
            }
        } catch (error) {
            console.error('Error moderating message:', error);
            throw new Error('Failed to moderate message');
        }
    }

    async getUserInfo(userId) {
        try {
            // This would typically fetch user info from Appwrite users collection
            // For now, return basic info
            return {
                id: userId,
                name: `User ${userId.substring(0, 8)}`,
                avatar: null
            };
        } catch (error) {
            console.error('Error getting user info:', error);
            return {
                id: userId,
                name: 'Unknown User',
                avatar: null
            };
        }
    }

    validateMessageContent(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Message content is required');
        }

        const trimmedContent = content.trim();
        
        if (trimmedContent.length === 0) {
            throw new Error('Message content cannot be empty');
        }

        if (trimmedContent.length > 1000) {
            throw new Error('Message content too long (max 1000 characters)');
        }

        // Basic profanity filter (can be enhanced)
        const blockedWords = ['spam', 'abuse']; // Add more as needed
        const contentLower = trimmedContent.toLowerCase();
        
        for (const word of blockedWords) {
            if (contentLower.includes(word)) {
                throw new Error('Message contains inappropriate content');
            }
        }

        return true;
    }

    // Rate limiting helper
    async checkRateLimit(userId, roomId) {
        // Implement rate limiting logic here
        // This could use Redis or in-memory storage
        return true; // For now, allow all messages
    }

    // Message formatting helper
    formatMessage(content) {
        // Basic formatting - can be enhanced
        return content
            .trim()
            .replace(/\s+/g, ' ') // Remove extra whitespace
            .substring(0, 1000); // Ensure max length
    }
}

export default ChatService;