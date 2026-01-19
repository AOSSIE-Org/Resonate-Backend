# Real-time In-Room Text Chat Function

This function provides real-time text chat capabilities for Resonate voice rooms, enabling participants to send, receive, and moderate text messages during active voice sessions.

## Features

- **Real-time Messaging**: WebSocket-based instant message delivery
- **Message History**: Persistent storage of recent messages (last 50-100 per room)
- **Moderation Tools**: Message deletion, user muting, and content filtering
- **Security**: Authorization checks, input validation, and XSS protection
- **Rate Limiting**: Built-in rate limiting to prevent spam
- **Scalable Architecture**: Designed for concurrent room usage

## Environment Variables

```bash
APPWRITE_API_KEY=your_appwrite_api_key
MASTER_DATABASE_ID=your_database_id
ROOMS_TABLE_ID=your_rooms_table_id
MESSAGES_TABLE_ID=your_messages_table_id
APPWRITE_FUNCTION_PROJECT_ID=your_project_id
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
```

## API Endpoints

### REST API

#### Get Message History
```http
GET /messages?roomId={roomId}&limit={limit}
```

**Parameters:**
- `roomId` (required): The room ID
- `limit` (optional): Number of messages to retrieve (default: 50, max: 100)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "roomId": "room_456",
      "senderId": "user_789",
      "content": "Hello everyone!",
      "timestamp": 1640995200000,
      "sender": {
        "id": "user_789",
        "name": "John Doe",
        "avatar": null
      },
      "isDeleted": false,
      "editedAt": null,
      "replyTo": null
    }
  ]
}
```

#### Moderate Message
```http
POST /moderate
```

**Request Body:**
```json
{
  "messageId": "msg_123",
  "action": "delete|mute-user|unmute-user",
  "roomId": "room_456",
  "moderatorId": "mod_789"
}
```

**Response:**
```json
{
  "success": true,
  "action": "delete",
  "messageId": "msg_123"
}
```

### WebSocket Events

#### Client → Server

##### Join Room
```javascript
socket.emit('join-room', {
  roomId: 'room_456',
  userId: 'user_789',
  token: 'livekit_access_token'
});
```

##### Send Message
```javascript
socket.emit('send-message', {
  roomId: 'room_456',
  content: 'Hello everyone!'
});
```

##### Delete Message
```javascript
socket.emit('delete-message', {
  messageId: 'msg_123'
});
```

#### Server → Client

##### Message History
```javascript
socket.on('message-history', (messages) => {
  console.log('Recent messages:', messages);
});
```

##### New Message
```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

##### Message Deleted
```javascript
socket.on('message-deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

##### User Joined/Left
```javascript
socket.on('user-joined', (data) => {
  console.log('User joined:', data.userId);
});

socket.on('user-left', (data) => {
  console.log('User left:', data.userId);
});
```

##### Error
```javascript
socket.on('error', (error) => {
  console.error('Chat error:', error.msg);
});
```

## Security Features

### Authorization
- Only room participants can send messages
- Only message senders and moderators can delete messages
- Only room moderators can mute/unmute users

### Input Validation
- Message content validation (max 1000 characters)
- XSS protection through HTML escaping
- SQL injection prevention
- Rate limiting (10 messages per minute per user)

### Content Moderation
- Basic profanity filtering
- Message deletion capabilities
- User muting functionality
- Content length restrictions

## Database Schema

### Messages Collection
```json
{
  "roomId": "string",
  "senderId": "string", 
  "content": "string",
  "timestamp": "number",
  "isDeleted": "boolean",
  "editedAt": "number|null",
  "replyTo": "string|null"
}
```

### Rooms Collection (Extended)
```json
{
  "mutedUsers": {
    "userId": {
      "mutedAt": "number",
      "mutedUntil": "number",
      "mutedBy": "string"
    }
  }
}
```

## Error Handling

The function includes comprehensive error handling for:
- Missing required fields
- Invalid room/user permissions
- Rate limiting violations
- Database connection issues
- WebSocket connection problems

## Performance Considerations

- Message history is limited to prevent memory issues
- Database queries are optimized with proper indexing
- WebSocket connections are managed efficiently
- Rate limiting prevents spam and abuse

## Testing

To test the function locally:

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Start the development server:
```bash
npm run dev
```

4. Connect to WebSocket endpoint:
```javascript
const socket = io('ws://localhost:3000');
```

## Integration with Frontend

The chat function is designed to integrate seamlessly with the Resonate Flutter app. Frontend should:

1. Connect to WebSocket when joining a room
2. Handle authentication with LiveKit token
3. Listen for real-time message events
4. Implement proper error handling
5. Respect rate limiting and content guidelines

## Future Enhancements

- Message reactions (emoji responses)
- Message threading/replies
- File sharing capabilities
- Advanced moderation tools
- Message search functionality
- Push notifications for mentions
- Message editing capabilities
- Rich text formatting
- Voice-to-text integration