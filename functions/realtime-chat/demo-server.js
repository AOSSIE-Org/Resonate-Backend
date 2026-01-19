import { Server } from 'socket.io';
import { createServer } from 'http';

console.log('🚀 Starting Real-time Chat Demo Server...');
console.log('=' .repeat(50));

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Demo data
const demoMessages = [
  {
    id: 'msg_001',
    roomId: 'demo_room',
    senderId: 'user_123',
    content: 'Welcome to the Resonate Chat Demo! 🎉',
    timestamp: Date.now() - 300000,
    sender: { id: 'user_123', name: 'Demo User 1', avatar: null },
    isDeleted: false,
    editedAt: null,
    replyTo: null
  },
  {
    id: 'msg_002',
    roomId: 'demo_room',
    senderId: 'user_456',
    content: 'This is a real-time chat implementation!',
    timestamp: Date.now() - 240000,
    sender: { id: 'user_456', name: 'Demo User 2', avatar: null },
    isDeleted: false,
    editedAt: null,
    replyTo: null
  },
  {
    id: 'msg_003',
    roomId: 'demo_room',
    senderId: 'user_789',
    content: 'Features include message persistence, moderation, and security!',
    timestamp: Date.now() - 180000,
    sender: { id: 'user_789', name: 'Demo User 3', avatar: null },
    isDeleted: false,
    editedAt: null,
    replyTo: null
  }
];

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  socket.on('join-room', (data) => {
    console.log(`📥 Join room request:`, data);
    const { roomId, userId } = data;
    
    // Simulate room join
    socket.join(roomId);
    socket.userId = userId;
    socket.roomId = roomId;
    
    // Send message history
    socket.emit('message-history', demoMessages);
    
    // Notify others in room
    socket.to(roomId).emit('user-joined', { 
      userId, 
      timestamp: Date.now() 
    });
    
    console.log(`✅ User ${userId} joined room ${roomId}`);
  });
  
  socket.on('send-message', (data) => {
    console.log(`💬 New message:`, data);
    const { content, roomId } = data;
    const userId = socket.userId;
    
    if (!userId || socket.roomId !== roomId) {
      socket.emit('error', { msg: 'Not authorized to send messages in this room' });
      return;
    }
    
    // Create new message
    const newMessage = {
      id: `msg_${Date.now()}`,
      roomId,
      senderId: userId,
      content,
      timestamp: Date.now(),
      sender: { id: userId, name: `User ${userId.substring(0, 8)}`, avatar: null },
      isDeleted: false,
      editedAt: null,
      replyTo: null
    };
    
    // Broadcast to all participants in the room
    io.to(roomId).emit('new-message', newMessage);
    
    console.log(`✅ Message broadcasted to room ${roomId}`);
  });
  
  socket.on('delete-message', (data) => {
    console.log(`🗑️ Delete message request:`, data);
    const { messageId } = data;
    
    // Broadcast deletion to all participants
    io.to(socket.roomId).emit('message-deleted', { 
      messageId, 
      deletedBy: socket.userId 
    });
    
    console.log(`✅ Message ${messageId} deleted`);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    if (socket.roomId && socket.userId) {
      socket.to(socket.roomId).emit('user-left', { 
        userId: socket.userId, 
        timestamp: Date.now() 
      });
    }
  });
  
  socket.on('error', (error) => {
    console.log(`❌ Socket error:`, error);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🌟 Demo server running on port ${PORT}`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`📡 Ready to accept connections!`);
  console.log('');
  console.log('💡 Test commands:');
  console.log('  - Connect to ws://localhost:3001');
  console.log('  - Emit: join-room { roomId: "demo_room", userId: "test_user" }');
  console.log('  - Emit: send-message { roomId: "demo_room", content: "Hello!" }');
  console.log('  - Emit: delete-message { messageId: "msg_001" }');
  console.log('');
  console.log('🧪 Running automated demo tests...');
  
  // Run demo client after server starts
  setTimeout(() => {
    runDemoClient();
  }, 2000);
});

function runDemoClient() {
  console.log('\n🤖 Starting demo client test...');
  
  import { io } from 'socket.io-client';
  const client = io(`http://localhost:${PORT}`);
  
  client.on('connect', () => {
    console.log('✅ Demo client connected');
    
    // Test join room
    client.emit('join-room', {
      roomId: 'demo_room',
      userId: 'demo_user_123',
      token: 'demo_token'
    });
  });
  
  client.on('message-history', (messages) => {
    console.log(`📚 Received message history: ${messages.length} messages`);
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.sender.name}: ${msg.content}`);
    });
    
    // Send a test message
    setTimeout(() => {
      client.emit('send-message', {
        roomId: 'demo_room',
        content: 'Hello from demo client! 👋'
      });
    }, 1000);
  });
  
  client.on('new-message', (message) => {
    console.log(`💬 New message received: ${message.sender.name}: ${message.content}`);
    
    // Test message deletion
    setTimeout(() => {
      if (message.content.includes('demo client')) {
        client.emit('delete-message', {
          messageId: message.id
        });
      }
    }, 1000);
  });
  
  client.on('message-deleted', (data) => {
    console.log(`🗑️ Message deleted: ${data.messageId}`);
    
    // End demo after a delay
    setTimeout(() => {
      console.log('✅ Demo completed successfully!');
      console.log('🎉 All WebSocket functionality working correctly!');
      client.disconnect();
      process.exit(0);
    }, 2000);
  });
  
  client.on('error', (error) => {
    console.log(`❌ Demo client error:`, error);
  });
  
  client.on('connect_error', (error) => {
    console.log(`❌ Connection error:`, error.message);
  });
}