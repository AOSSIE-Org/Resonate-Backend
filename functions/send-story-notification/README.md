

# Send Story Notification Function

This function sends push notifications to all followers of a story creator when a new story is published or when there's an update related to their stories.

## 🧰 Usage
This function is triggered (usually via HTTP or Appwrite function execution) when you want to notify followers about new story content from creators they follow.

### How does it work
1. Receives a payload containing the `creatorId` and notification details (title, body, etc.).
2. Fetches the creator's user document from the users collection.
3. Extracts FCM tokens from all followers in the creator's followers subcollection.
4. Sends a push notification to all collected follower tokens using Firebase Cloud Messaging (FCM).

**Note:**
- The function expects the request body to include `creatorId` and `payload`.
- If no follower tokens are found, no notification is sent.
- Make sure the environment variables for Appwrite and Firebase are set correctly.
- Requires `UserDataDatabaseID` and `UsersCollectionID` environment variables to be configured.
