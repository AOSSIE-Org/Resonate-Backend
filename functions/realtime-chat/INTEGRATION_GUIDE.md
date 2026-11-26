# Real-time Chat Integration Guide

This guide explains how to integrate the real-time chat functionality with the Resonate Flutter frontend application.

## Overview

The real-time chat function provides WebSocket-based messaging capabilities for voice rooms. It integrates seamlessly with the existing Resonate infrastructure using Appwrite for authentication and data persistence.

## Architecture

```
Frontend (Flutter) <-> WebSocket <-> Appwrite Function <-> Appwrite Database
```

## Integration Steps

### 1. Environment Setup

Add the following to your Flutter app's environment configuration:

```dart
// lib/config/environment.dart
class Environment {
  static const String chatFunctionEndpoint = String.fromEnvironment(
    'CHAT_FUNCTION_ENDPOINT',
    defaultValue: 'https://your-appwrite-function-url.com',
  );
  
  static const String websocketUrl = String.fromEnvironment(
    'WEBSOCKET_URL', 
    defaultValue: 'wss://your-appwrite-function-url.com',
  );
}
```

### 2. Dependencies

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.3+1
  web_socket_channel: ^2.4.0
  provider: ^6.0.5
```

### 3. Chat Service Implementation

Create a chat service to handle WebSocket connections and messaging:

```dart
// lib/services/chat_service.dart
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter/foundation.dart';

class ChatService extends ChangeNotifier {
  io.Socket? _socket;
  List<ChatMessage> _messages = [];
  bool _isConnected = false;
  String? _currentRoomId;
  
  List<ChatMessage> get messages => _messages;
  bool get isConnected => _isConnected;
  
  void connectToRoom(String roomId, String userId, String liveKitToken) {
    _currentRoomId = roomId;
    
    _socket = io.io(
      Environment.websocketUrl,
      io.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .enableForceNew()
        .setTimeout(5000)
        .build(),
    );
    
    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('Connected to chat room: $roomId');
      
      // Join the room
      _socket!.emit('join-room', {
        'roomId': roomId,
        'userId': userId,
        'token': liveKitToken,
      });
      
      notifyListeners();
    });
    
    _socket!.onDisconnect((_) {
      _isConnected = false;
      debugPrint('Disconnected from chat room');
      notifyListeners();
    });
    
    _socket!.on('message-history', (data) {
      _messages = (data as List)
          .map((msg) => ChatMessage.fromJson(msg))
          .toList();
      notifyListeners();
    });
    
    _socket!.on('new-message', (data) {
      final message = ChatMessage.fromJson(data);
      _messages.add(message);
      notifyListeners();
    });
    
    _socket!.on('message-deleted', (data) {
      final messageId = data['messageId'] as String;
      _messages.removeWhere((msg) => msg.id == messageId);
      notifyListeners();
    });
    
    _socket!.on('error', (error) {
      debugPrint('Chat error: $error');
      // Handle error appropriately
    });
  }
  
  void sendMessage(String content) {
    if (_socket == null || !_isConnected || _currentRoomId == null) {
      debugPrint('Cannot send message: not connected to room');
      return;
    }
    
    _socket!.emit('send-message', {
      'roomId': _currentRoomId,
      'content': content.trim(),
    });
  }
  
  void deleteMessage(String messageId) {
    if (_socket == null || !_isConnected) {
      debugPrint('Cannot delete message: not connected');
      return;
    }
    
    _socket!.emit('delete-message', {
      'messageId': messageId,
    });
  }
  
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _messages.clear();
    _currentRoomId = null;
    _isConnected = false;
    notifyListeners();
  }
}

class ChatMessage {
  final String id;
  final String roomId;
  final String senderId;
  final String content;
  final DateTime timestamp;
  final ChatUser sender;
  final bool isDeleted;
  final DateTime? editedAt;
  final String? replyTo;
  
  ChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.content,
    required this.timestamp,
    required this.sender,
    required this.isDeleted,
    this.editedAt,
    this.replyTo,
  });
  
  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      roomId: json['roomId'],
      senderId: json['senderId'],
      content: json['content'],
      timestamp: DateTime.fromMillisecondsSinceEpoch(json['timestamp']),
      sender: ChatUser.fromJson(json['sender']),
      isDeleted: json['isDeleted'] ?? false,
      editedAt: json['editedAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(json['editedAt'])
          : null,
      replyTo: json['replyTo'],
    );
  }
}

class ChatUser {
  final String id;
  final String name;
  final String? avatar;
  
  ChatUser({
    required this.id,
    required this.name,
    this.avatar,
  });
  
  factory ChatUser.fromJson(Map<String, dynamic> json) {
    return ChatUser(
      id: json['id'],
      name: json['name'],
      avatar: json['avatar'],
    );
  }
}
```

### 4. Chat UI Implementation

Create a chat widget for the room interface:

```dart
// lib/widgets/chat_widget.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';

class ChatWidget extends StatefulWidget {
  final String roomId;
  final String userId;
  final String liveKitToken;
  
  const ChatWidget({
    Key? key,
    required this.roomId,
    required this.userId,
    required this.liveKitToken,
  }) : super(key: key);
  
  @override
  _ChatWidgetState createState() => _ChatWidgetState();
}

class _ChatWidgetState extends State<ChatWidget> {
  final TextEditingController _messageController = TextEditingController();
  late ChatService _chatService;
  
  @override
  void initState() {
    super.initState();
    _chatService = Provider.of<ChatService>(context, listen: false);
    _chatService.connectToRoom(
      widget.roomId,
      widget.userId,
      widget.liveKitToken,
    );
  }
  
  @override
  void dispose() {
    _messageController.dispose();
    _chatService.disconnect();
    super.dispose();
  }
  
  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isNotEmpty) {
      _chatService.sendMessage(content);
      _messageController.clear();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<ChatService>(
      builder: (context, chatService, child) {
        return Container(
          height: 300,
          decoration: BoxDecoration(
            color: Colors.grey[900],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              // Chat Header
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(12),
                    topRight: Radius.circular(12),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.chat_bubble, color: Colors.white),
                    SizedBox(width: 8),
                    Text(
                      'Room Chat',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Spacer(),
                    if (!chatService.isConnected)
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Connecting...',
                          style: TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                  ],
                ),
              ),
              
              // Messages List
              Expanded(
                child: ListView.builder(
                  reverse: true,
                  padding: EdgeInsets.all(8),
                  itemCount: chatService.messages.length,
                  itemBuilder: (context, index) {
                    final message = chatService.messages.reversed.toList()[index];
                    return _buildMessageItem(message);
                  },
                ),
              ),
              
              // Message Input
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                    bottomRight: Radius.circular(12),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        style: TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          hintStyle: TextStyle(color: Colors.grey[400]),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.grey[700],
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        maxLines: 3,
                        minLines: 1,
                      ),
                    ),
                    SizedBox(width: 8),
                    IconButton(
                      onPressed: _sendMessage,
                      icon: Icon(Icons.send, color: Colors.blue),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.grey[700],
                        shape: CircleBorder(),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildMessageItem(ChatMessage message) {
    final isCurrentUser = message.senderId == widget.userId;
    
    return Container(
      margin: EdgeInsets.symmetric(vertical: 4),
      child: Align(
        alignment: isCurrentUser ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: BoxConstraints(maxWidth: 280),
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isCurrentUser ? Colors.blue[700] : Colors.grey[700],
            borderRadius: BorderRadius.circular(12).copyWith(
              bottomLeft: isCurrentUser ? Radius.circular(12) : Radius.circular(4),
              bottomRight: isCurrentUser ? Radius.circular(4) : Radius.circular(12),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isCurrentUser) ...[
                Text(
                  message.sender.name,
                  style: TextStyle(
                    color: Colors.grey[300],
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
              ],
              Text(
                message.content,
                style: TextStyle(color: Colors.white),
              ),
              SizedBox(height: 4),
              Text(
                _formatTimestamp(message.timestamp),
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
```

### 5. Room Integration

Integrate the chat widget into your room page:

```dart
// lib/screens/room_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/chat_widget.dart';
import '../services/chat_service.dart';

class RoomScreen extends StatefulWidget {
  final String roomId;
  final String userId;
  final String liveKitToken;
  
  const RoomScreen({
    Key? key,
    required this.roomId,
    required this.userId,
    required this.liveKitToken,
  }) : super(key: key);
  
  @override
  _RoomScreenState createState() => _RoomScreenState();
}

class _RoomScreenState extends State<RoomScreen> {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ChatService(),
      child: Scaffold(
        appBar: AppBar(
          title: Text('Voice Room'),
        ),
        body: Column(
          children: [
            // Voice participants view
            Expanded(
              flex: 2,
              child: Container(
                color: Colors.grey[900],
                child: Center(
                  child: Text('Voice Participants Area'),
                ),
              ),
            ),
            
            // Chat Widget
            Expanded(
              flex: 1,
              child: ChatWidget(
                roomId: widget.roomId,
                userId: widget.userId,
                liveKitToken: widget.liveKitToken,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 6. Error Handling

Implement proper error handling in your chat service:

```dart
// Enhanced error handling in ChatService
void _handleError(dynamic error) {
  String message = 'An error occurred';
  
  if (error is Map && error.containsKey('msg')) {
    message = error['msg'];
  } else if (error is String) {
    message = error;
  }
  
  // Show error to user
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.red,
    ),
  );
}
```

## Security Considerations

### 1. Input Validation
- All messages are validated on the backend
- Maximum message length is enforced (1000 characters)
- XSS protection is implemented
- Profanity filtering is available

### 2. Rate Limiting
- 10 messages per minute per user
- Automatic rate limiting enforcement
- Graceful handling of rate limit errors

### 3. Authorization
- Only room participants can send messages
- Only message senders and moderators can delete messages
- Room moderators can mute/unmute users

## Performance Optimization

### 1. Message History
- Only last 50 messages are loaded initially
- Pagination can be implemented for older messages
- Efficient message rendering in Flutter

### 2. Connection Management
- Automatic reconnection handling
- Connection state monitoring
- Graceful disconnection

## Testing

### 1. Unit Tests
```dart
// test/chat_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:your_app/services/chat_service.dart';

void main() {
  group('ChatService', () {
    test('should connect to room successfully', () {
      // Test connection logic
    });
    
    test('should send message correctly', () {
      // Test message sending
    });
    
    test('should handle errors gracefully', () {
      // Test error handling
    });
  });
}
```

### 2. Integration Tests
```dart
// integration_test/chat_integration_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Chat Integration', () {
    test('full chat flow', () async {
      // Test complete chat workflow
    });
  });
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check WebSocket URL configuration
   - Verify network connectivity
   - Check Appwrite function logs

2. **Messages Not Sending**
   - Verify user is room participant
   - Check rate limiting
   - Validate message content

3. **Messages Not Appearing**
   - Check message history endpoint
   - Verify WebSocket event listeners
   - Check for message filtering

### Debug Mode

Enable debug logging:

```dart
// In ChatService constructor
_socket!.onConnect((_) {
  if (kDebugMode) {
    debugPrint('Chat connected: ${socket.id}');
  }
});
```

## Deployment

### 1. Backend Deployment
Deploy the Appwrite function following the standard deployment process.

### 2. Frontend Configuration
Update your Flutter app's configuration with production endpoints:

```dart
// lib/config/production.dart
class ProductionConfig {
  static const String chatFunctionEndpoint = 'https://your-production-url.com';
  static const String websocketUrl = 'wss://your-production-url.com';
}
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Appwrite function logs
3. Test with the provided test suite
4. Contact the development team