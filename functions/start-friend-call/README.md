

# Start Friend Call Function

Sends a high-priority FCM data message to a single recipient to initiate a friend call (ring/accept flow), **unless the recipient's presence status refuses calls**.

## Usage
Invoke this function (HTTP or Appwrite execution) with a JSON body containing:

- `recieverFCMToken` — the FCM registration token for the recipient device (string).
- `recieverUid` — the callee's user id, used for the presence check (string, optional but strongly recommended). If absent the function falls back to `recieverUid` inside the serialized call model in `data.extra`; if that is missing too, the presence check is skipped and the call goes through.
- `data` — an object with any custom key/value pairs the client app expects (e.g. caller info, callId, action).

## What it does
1. Parses the request body and validates `recieverFCMToken`.
2. Reads the callee's `status` from the users collection and refuses the call if it is one of `dnd` or `inroom`.
3. Otherwise uses Firebase Admin (service account JSON) to send a single FCM message with the `data` payload and high Android priority.
4. Logs the outcome and returns a JSON response indicating the result.

## Presence gate
This function is the chokepoint for incoming calls: it runs before the callee's device rings and before either side asks **Join Room** for a LiveKit token, so a blocked call never establishes a connection.

| `status` | Behaviour |
| --- | --- |
| `online`, `idle` | Call goes through |
| `invisible` | Call goes through — invisible hides availability from others, it does not restrict the user |
| `offline` | Call goes through (the user may still be signed in on another device); the push simply may not land |
| `dnd` | **Blocked** |
| `inroom` | **Blocked** |

The check **fails open**: if the users row cannot be read (network error, missing row, missing env vars) the call is allowed through, so a database hiccup degrades to the pre-presence behaviour rather than silently swallowing every call.

## Responses
All responses are JSON.

| Status | Body | When |
| --- | --- | --- |
| 200 | `{ "blocked": false, "delivered": true, "message": "Notification sent" }` | Push accepted by FCM |
| 200 | `{ "blocked": false, "delivered": false, "message": "Notification could not be delivered" }` | FCM rejected the send |
| 200 | `{ "blocked": true, "reason": "dnd" \| "inroom", "message": "Reciever is not accepting calls" }` | Presence gate refused the call |
| 400 | `{ "message": "Malformed request body" }` | Body is not valid JSON |
| 400 | `{ "message": "Missing recieverFCMToken" }` | `recieverFCMToken` absent or empty |

Blocked calls return **200, not 4xx**, so the client can decode `blocked`/`reason` through the shared `Functions.execute()` helper (which throws on any status >= 400).

## Environment / Setup
- Requires the Firebase service account JSON file (`resonate-service-account.json`) inside the function folder — gitignored, provisioned out of band.
- `UserDataDatabaseID` and `UsersCollectionID` — set in `appwrite.json` and `.env`.
- `APPWRITE_ENDPOINT`, `APPWRITE_API_KEY` and `APPWRITE_FUNCTION_PROJECT_ID` come from the project-level variables set by `init.sh`.
- Scopes must include the database read scopes (`databases.read`, `collections.read`, `documents.read`, `tables.read`, `rows.read`) in addition to `users.read`.

## Notes & Error Handling
- The function uses `getMessaging(app).send()` which requires exactly one of `token`, `topic`, or `condition`. This function uses `token`.
- Ensure the recipient token is valid and the Firebase project in the service account matches the tokens' project.
- The `status` values here must stay in sync with the `status` enum on the users collection and `PresenceStatus` in the Flutter app.
