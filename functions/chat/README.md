# Chat function
Function to handle in-room text chat (send, history, delete, mute).

## 🧰 Usage

### POST /

Receives an action and associated parameters to manage in-room text chat.

**Parameters**

| Name | Description | Location | Type | Sample Value |
| ---- | ----------- | -------- | ---- | ------------ |
| action | Action to perform (`send`, `history`, `delete`, `mute`, `checkMute`) | Body | String | `send` |
| roomId | ID of the room | Body | String | `Zjc...5PH` |
| creatorId | User ID of the message sender (for `send`) | Body | String | `652000000002` |
| creatorUsername | Username of the sender (for `send`) | Body | String | `johndoe` |
| creatorName | Display name of the sender (for `send`) | Body | String | `John Doe` |
| creatorImgUrl | Profile image URL of the sender (for `send`) | Body | String | `https://...` |
| content | Message content (for `send`) | Body | String | `Hello everyone!` |
| hasValidTag | Whether sender has a verified tag (for `send`) | Body | Boolean | `false` |
| messageId | ID of the message to delete (for `delete`) | Body | String | `abc...xyz` |
| uid | User ID requesting the delete (for `delete`) | Body | String | `652000000002` |
| targetUid | User ID to mute/unmute (for `mute`) | Body | String | `652000000003` |
| moderatorId | User ID of the moderator (for `mute`) | Body | String | `652000000002` |
| isMuted | Mute or unmute (for `mute`, default `true`) | Body | Boolean | `false` |
| limit | Max messages to return (for `history`, default `100`) | Body | Number | `100` |
| offset | Number of messages to skip (for `history`) | Body | Number | `0` |

**Response**

Sample `200` Response (send):

```json
{
    "msg": "Message sent",
    "message": {
        "$id": "abc...xyz",
        "$createdAt": "2026-01-01T00:00:00.000+00:00",
        "roomId": "Zjc...5PH",
        "messageId": "abc...xyz",
        "creatorId": "652000000002",
        "creatorUsername": "johndoe",
        "creatorName": "John Doe",
        "creatorImgUrl": "https://...",
        "content": "Hello everyone!",
        "hasValidTag": false,
        "index": 1735689600000,
        "isEdited": false,
        "isDeleted": false,
        "creationDateTime": "2026-01-01T00:00:00.000Z"
    }
}
```

Sample `200` Response (history):

```json
{
    "msg": "Success",
    "messages": [...],
    "total": 42
}
```

Sample `200` Response (delete):

```json
{
    "msg": "Message deleted"
}
```

Sample `200` Response (mute):

```json
{
    "msg": "User muted"
}
```

Sample `200` Response (unmute):

```json
{
    "msg": "User unmuted"
}
```

Sample `200` Response (checkMute):

```json
{
    "msg": "Success",
    "isMuted": true
}
```

Sample `400` Response:

```json
{
    "msg": "Missing required fields: action"
}
```

Sample `403` Response:

```json
{
    "msg": "User is not a participant in this room"
}
```

Sample `500` Response:

```json
{
    "msg": "Chat operation failed"
}
```

## 🗄️ Required Appwrite Collections

### `chatMessages` (`MESSAGES_COLLECTION_ID`)

Existing collection for storing chat messages.

| Attribute | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| roomId | string | Yes | ID of the room |
| messageId | string | Yes | Unique message ID (same as `$id`) |
| creatorId | string | Yes | User ID of the message sender |
| creatorUsername | string | Yes | Username of the sender |
| creatorName | string | Yes | Display name of the sender |
| creatorImgUrl | string | No | Profile image URL |
| content | string | Yes | Message content |
| hasValidTag | boolean | Yes | Verified tag flag (default false) |
| index | number | Yes | Sort index (millisecond timestamp) |
| isEdited | boolean | Yes | Edit flag (default false) |
| isDeleted | boolean | Yes | Soft delete flag (default false) |
| creationDateTime | string | Yes | ISO 8601 creation timestamp |

**Indexes:**
- `roomId` (key, ascending) — for querying messages by room
- `roomId_index` (composite, `roomId` ascending + `index` ascending) — for sorted retrieval

### `chatMutes` (`MUTES_COLLECTION_ID`)

New collection for storing mute records.

| Attribute | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| roomId | string | Yes | ID of the room |
| uid | string | Yes | User ID of the muted user |
| mutedBy | string | Yes | User ID of the moderator |

**Indexes:**
- `roomId_uid` (composite, `roomId` ascending + `uid` ascending) — for efficient mute lookups

## ⚙️ Configuration

| Setting | Value |
| ------- | ----- |
| Runtime | Node (18.0) |
| Entrypoint | `src/main.js` |
| Build Commands | `npm install && npm run start` |
| Permissions | `any` |
| Timeout (Seconds) | 15 |

## 🔒 Environment Variables

### APPWRITE_API_KEY

API Key to use Appwrite Server SDK.

| Question | Answer |
| -------- | ------ |
| Required | Yes |
| Sample Value | `62...97` |
| Documentation | [Appwrite API Keys](https://appwrite.io/docs/advanced/platform/api-keys) |

### MASTER_DATABASE_ID

Database ID of master database in Appwrite.

| Question | Answer |
| -------- | ------ |
| Required | Yes |
| Sample Value | `64a521785f5be62b796f` |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### MESSAGES_COLLECTION_ID

Collection ID of the chatMessages collection.

| Question | Answer |
| -------- | ------ |
| Required | Yes |
| Sample Value | `670d812c0002c33c09a8` |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### MUTES_COLLECTION_ID

Collection ID of the chatMutes collection.

| Question | Answer |
| -------- | ------ |
| Required | Yes |
| Sample Value | `(create in Appwrite console)` |
| Documentation | This PR |

### ROOMS_COLLECTION_ID

Collection ID of the rooms collection.

| Question | Answer |
| -------- | ------ |
| Required | Yes |
| Sample Value | `64a5217e695bf2c4ec9c` |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### PARTICIPANTS_COLLECTION_ID

Collection ID of the participants collection.

| Question | Answer |
| -------- | ------ |
| Required | Yes |
| Sample Value | `64a63e508145d1084abf` |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

## 📡 Real-time Delivery

This function handles **storage, validation, and moderation server-side**. Real-time message delivery relies on **Appwrite Realtime** — the frontend subscribes to document changes on the `chatMessages` collection via:

```dart
String channel =
    'databases.$masterDatabaseId.collections.$chatMessagesCollectionId.documents';
realtime.subscribe([channel]);
```

When a message is created via the `send` action, Appwrite pushes the new document to all subscribed clients. The frontend filters by `roomId` client-side.
