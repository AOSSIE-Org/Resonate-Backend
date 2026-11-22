# Room chat function

Invoke the function from an authenticated Appwrite session and send a JSON body with an `action`. Appwrite supplies the caller's ID in `x-appwrite-user-id` and a scoped API key in `x-appwrite-key`. The function derives message authorship and moderation authority from that caller's ID and stored room/profile rows.

| Action | Body fields besides `action` | Authorization |
| --- | --- | --- |
| `send` | `roomId`, `content` (up to 1,000 characters), optional `messageId` | Active room participant with no mute record |
| `history` | `roomId`, optional integer `limit` (1–200, default 100) and `offset` (non-negative, default 0) | Active room participant |
| `delete` | `messageId` | The message's creator or its room's admin |
| `mute` | `roomId`, `targetUid`, optional boolean `isMuted` (default `true`) | Room admin |
| `checkMute` | `roomId` | Active room participant; returns the caller's own mute status |

For example:

```json
{"action": "send", "roomId": "room123", "content": "Hello everyone!"}
```

`send` returns `{ "msg": "Message sent", "message": ... }`. `history` returns `{ "msg": "Success", "messages": [...], "total": ... }` with deleted messages filtered out and ordered by `index`, then Appwrite's unique `$sequence` for equal indexes. This keeps pagination deterministic for an unchanged result set.

`delete` marks the row as deleted. Mute and unmute are idempotent: each room/user pair has one deterministic mute row ID. `checkMute` returns `{ "msg": "Success", "isMuted": true }` when the caller is muted.

| Status | Meaning |
| --- | --- |
| 400 | Invalid JSON, unknown action, or invalid fields (e.g. `{ "msg": "Missing required fields: action" }`) |
| 401 | No authenticated caller |
| 403 | The caller does not have the required room role or is muted |
| 404 | The requested message or user profile was not found |
| 500 | An Appwrite or function configuration error |

## Appwrite setup

1. Create a Node 24 function with `functions/chat` as its source, `src/main.js` as its entrypoint, and `npm ci` as its build command. Set execute access to authenticated users and grant `rows.read` and `rows.write` to its ephemeral key. The function additionally enforces room-level authorization for each action.
2. Copy the table IDs from `.env.example` into the function variables and adjust for the deployment. `APPWRITE_FUNCTION_PROJECT_ID` is provided by Appwrite. `APPWRITE_ENDPOINT` can override the runtime API endpoint.
3. Use the existing `rooms`, `participants`, `users`, and `messages` tables. Keep the `(uid, roomId)` index on `participants` and the `(roomId, index)` index on `messages`. On deployments that require all filter columns to be indexed, add a `messages` key index covering `(roomId, isDeleted, index)` for history queries. Appwrite supplies `$sequence`.
4. Create an empty `chat_mutes` table with required string columns `roomId`, `uid`, and `mutedBy` (length 100 each). Give clients no direct permissions on this table; chat reads and writes it with the scoped key. If a preview deployment already used random mute IDs, migrate those rows to the new deterministic ID format before enabling this revision.

Message rows use the app's existing schema. The function assigns `creatorId` and display fields from the caller's profile, and maintains the current 0–1000 range for `index`. The Flutter app can keep its existing Appwrite Realtime subscription for messages; rollout of the function and any change to direct table access are separate from this PR.

## Local verification

```sh
npm ci
npm test
```

Tests stub the Appwrite SDK and require no deployment, credentials, or network requests during execution.
