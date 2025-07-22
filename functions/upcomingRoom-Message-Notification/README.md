

# Upcoming Room Message Notification Function

This function sends push notifications to all subscribers and the creator of an upcoming room when a relevant event (such as a new message or update) occurs.

## 🧰 Usage
This function is triggered (usually via HTTP or Appwrite function execution) when you want to notify users about activity in an upcoming room.

### How does it work
1. Receives a payload containing the `roomId` and notification details (title, body, etc.).
2. Fetches all subscribers of the specified upcoming room and collects their FCM registration tokens.
3. Fetches the creator's FCM tokens for the room.
4. Sends a push notification to all collected tokens using Firebase Cloud Messaging (FCM).

**Note:**
- The function expects the request body to include `roomId` and `payload`.
- If no tokens are found, no notification is sent.
- Make sure the environment variables for Appwrite and Firebase are set correctly.
