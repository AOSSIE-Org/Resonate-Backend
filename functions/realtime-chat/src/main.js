import { Server } from 'socket.io';
import { createServer } from 'http';
import AppwriteService from './appwrite.js';
import ChatService from './chat.js';
import { throwIfMissing, validateMessage } from './utils.js';

const appwrite = new AppwriteService();
const chatService = new ChatService();

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "MASTER_DATABASE_ID",
        "ROOMS_TABLE_ID",
        "MESSAGES_TABLE_ID",
        "APPWRITE_FUNCTION_PROJECT_ID",
    ]);

    // Handle HTTP requests for REST API
    if (req.method === 'GET' || req.method === 'POST') {
        return handleHttpRequest({ req, res, log, error });
    }

    // Handle WebSocket upgrade
    if (req.headers.upgrade === 'websocket') {
        return handleWebSocketUpgrade({ req, res, log, error });
    }

    return res.json({ msg: "Method not allowed" }, 405);
};

async function handleHttpRequest({ req, res, log, error }) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;

        switch (path) {
            case '/messages':
                if (req.method === 'GET') {
                    return await getMessages({ req, res, log, error });
                }
                break;
            
            case '/moderate':
                if (req.method === 'POST') {
                    return await moderateMessage({ req, res, log, error });
                }
                break;

            default:
                return res.json({ msg: "Endpoint not found" }, 404);
        }
    } catch (err) {
        error(`HTTP Error: ${err.message}`);
        return res.json({ msg: "Internal server error" }, 500);
    }
}

async function getMessages({ req, res, log, error }) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const roomId = url.searchParams.get('roomId');
        const limit = parseInt(url.searchParams.get('limit')) || 50;

        if (!roomId) {
            return res.json({ msg: "roomId is required" }, 400);
        }

        const messages = await chatService.getMessageHistory(roomId, limit);
        return res.json({ messages });
    } catch (err) {
        error(`Get messages error: ${err.message}`);
        return res.json({ msg: "Failed to retrieve messages" }, 500);
    }
}

async function moderateMessage({ req, res, log, error }) {
    try {
        const { messageId, action, roomId, moderatorId } = JSON.parse(req.body);
        
        throwIfMissing({ messageId, action, roomId, moderatorId }, ["messageId", "action", "roomId", "moderatorId"]);

        // Verify moderator permissions
        const hasPermission = await appwrite.verifyModeratorPermission(roomId, moderatorId);
        if (!hasPermission) {
            return res.json({ msg: "Insufficient permissions" }, 403);
        }

        const result = await chatService.moderateMessage(messageId, action, moderatorId);
        return res.json(result);
    } catch (err) {
        error(`Moderation error: ${err.message}`);
        return res.json({ msg: "Moderation failed" }, 500);
    }
}

async function handleWebSocketUpgrade({ req, res, log, error }) {
    const server = createServer();
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        log(`User connected: ${socket.id}`);

        socket.on('join-room', async (data) => {
            try {
                const { roomId, userId, token } = data;
                throwIfMissing({ roomId, userId, token }, ["roomId", "userId", "token"]);

                // Verify user is participant in the room
                const isParticipant = await appwrite.verifyRoomParticipant(roomId, userId);
                if (!isParticipant) {
                    socket.emit('error', { msg: 'Not a room participant' });
                    return;
                }

                // Join the room
                socket.join(roomId);
                socket.userId = userId;
                socket.roomId = roomId;

                // Send recent message history
                const messages = await chatService.getMessageHistory(roomId, 50);
                socket.emit('message-history', messages);

                // Notify others in room
                socket.to(roomId).emit('user-joined', { userId, timestamp: Date.now() });

                log(`User ${userId} joined room ${roomId}`);
            } catch (err) {
                error(`Join room error: ${err.message}`);
                socket.emit('error', { msg: 'Failed to join room' });
            }
        });

        socket.on('send-message', async (data) => {
            try {
                const { content, roomId } = data;
                const userId = socket.userId;

                if (!userId || socket.roomId !== roomId) {
                    socket.emit('error', { msg: 'Not authorized to send messages in this room' });
                    return;
                }

                // Validate message
                validateMessage(content);

                // Check if user is muted
                const isMuted = await chatService.isUserMuted(roomId, userId);
                if (isMuted) {
                    socket.emit('error', { msg: 'You are muted in this room' });
                    return;
                }

                // Create and save message
                const message = await chatService.createMessage({
                    roomId,
                    senderId: userId,
                    content,
                    timestamp: Date.now()
                });

                // Broadcast to all participants in the room
                io.to(roomId).emit('new-message', message);

                log(`Message sent in room ${roomId} by user ${userId}`);
            } catch (err) {
                error(`Send message error: ${err.message}`);
                socket.emit('error', { msg: 'Failed to send message' });
            }
        });

        socket.on('delete-message', async (data) => {
            try {
                const { messageId } = data;
                const userId = socket.userId;
                const roomId = socket.roomId;

                if (!userId || !roomId) {
                    socket.emit('error', { msg: 'Not authorized' });
                    return;
                }

                // Check if user is moderator or message sender
                const canDelete = await chatService.canDeleteMessage(messageId, userId, roomId);
                if (!canDelete) {
                    socket.emit('error', { msg: 'Insufficient permissions to delete message' });
                    return;
                }

                await chatService.deleteMessage(messageId, userId);
                
                // Notify all participants
                io.to(roomId).emit('message-deleted', { messageId, deletedBy: userId });

                log(`Message ${messageId} deleted by user ${userId}`);
            } catch (err) {
                error(`Delete message error: ${err.message}`);
                socket.emit('error', { msg: 'Failed to delete message' });
            }
        });

        socket.on('disconnect', () => {
            log(`User disconnected: ${socket.id}`);
            if (socket.roomId && socket.userId) {
                socket.to(socket.roomId).emit('user-left', { 
                    userId: socket.userId, 
                    timestamp: Date.now() 
                });
            }
        });
    });

    // Handle the upgrade request
    return new Promise((resolve) => {
        server.on('upgrade', (request, socket, head) => {
            io.engine.handleUpgrade(request, socket, head);
        });
        
        server.emit('connection', 1, req);
        resolve(res.empty());
    });
}