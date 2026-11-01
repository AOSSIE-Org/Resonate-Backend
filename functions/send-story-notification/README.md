

# Send Story Notification Function

This function sends push notifications to all followers of a story creator when a new story is published or when there's an update related to their stories.

## 🧰 Usage
This function is triggered (usually via HTTP or Appwrite function execution) when you want to notify followers about new story content from creators they follow.

### How does it work
1. Receives a payload containing the `creatorId` and notification details (title, body, etc.).
2. Fetches the creator's user document from the users collection.
3. Collects the `followerUserId` of every row in the creator's followers table.
4. Addresses one `createPush` at those user ids, via Appwrite Messaging.

**Note:**
- The function expects the request body to include `creatorId` and `payload`.
- No device tokens are involved: a user is addressed by id, and the app subscribes to its own
  `users/<uid>` topic.
- If the creator has no followers, no notification is sent.
- Requires `UserDataDatabaseID` and `UsersCollectionID` environment variables to be configured.
- Scopes: `tables.read`, `rows.read`, `messages.write`.
