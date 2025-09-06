

# Start Friend Call Function

Sends a high-priority FCM data message to a single recipient to initiate a friend call (ring/accept flow).

## Usage
Invoke this function (HTTP or Appwrite execution) with a JSON body containing:

- `recieverFCMToken` — the FCM registration token for the recipient device (string).
- `data` — an object with any custom key/value pairs the client app expects (e.g. caller info, callId, action).


## What it does
1. Parses request body and validates `recieverFCMToken`.
2. Uses Firebase Admin (service account JSON) to send a single FCM message with the `data` payload and high Android priority.
3. Logs success or error and returns a JSON response indicating result.

## Environment / Setup
- Requires Firebase service account JSON file (`resonate-service-account.json`) inside the function folder.

## Notes & Error Handling
- If `recieverFCMToken` is missing or empty, the function returns 400 and logs the issue.
- The function uses `getMessaging(app).send()` which requires exactly one of `token`, `topic`, or `condition`. This function uses `token`.
- Ensure the recipient token is valid and the Firebase project in the service account matches the tokens' project.

This function is triggered (usually via HTTP or Appwrite function execution) when you want to notify followers about new story content from creators they follow.

### How does it work
1. Receives a payload containing the `creatorId` and notification details (title, body, etc.).
2. Fetches the creator's user document from the users collection.
3. Extracts FCM tokens from all followers in the creator's followers subcollection.
4. Sends a push notification to all collected follower tokens using Firebase Cloud Messaging (FCM).

**Note:**
- The function expects the request body to include `creatorId` and `payload`.
- If no follower tokens are found, no notification is sent.