

# Upcoming Room Message Notification Function

This function sends push notifications to all subscribers and the creator of an upcoming room when a relevant event (such as a new message or update) occurs.

## 🧰 Usage
This function is triggered (usually via HTTP or Appwrite function execution) when you want to notify users about activity in an upcoming room.

### How does it work
1. Receives a payload containing the `roomId` and notification details (title, body, etc.).
2. Fetches all subscribers of the specified upcoming room, plus the room's creator.
3. Addresses one `createPush` at those user ids, via Appwrite Messaging.

**Note:**
- The function expects the request body to include `roomId` and `payload`.
- No device tokens are involved: a user is addressed by id, and the app subscribes to its own
  `users/<uid>` topic.
- If the room has no subscribers, no notification is sent.
- Scopes: `tables.read`, `rows.read`, `messages.write`.
