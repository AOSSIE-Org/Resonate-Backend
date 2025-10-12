# Live Chapter Room Creation Function 
Function to create live chapter rooms in Livekit for real-time storytelling sessions.

## 🧰 Usage

### POST /

Receives live chapter room data and creates a room in Livekit. Returns access token for the admin/creator to join.

**Parameters**

| Name           | Description                              | Location | Type   | Sample Value   |
| -------------- | ---------------------------------------- | -------- | ------ | -------------- |
| appwriteRoomId | Appwrite document ID of the chapter/room | Body     | String | `68c3b9910...` |
| adminUid       | User ID of the chapter creator/admin     | Body     | String | `6899f2740...` |
  

**Response**

Sample `200` Response:

```json
{
    "msg": "Room created Successfully",
    "livekit_room": "livekitRoom",
    "livekit_socket_url": "livekitSocketUrl",
    "access_token": "accessToken",
}
```

Sample `400` Response:

```json
{
    "msg": "Missing required parameter: name"
}
```

Sample `500` Response:

```json
{
    "msg": "Room creation failed"
}
```

## ⚙️ Configuration

| Setting           | Value         |
| ----------------- | ------------- |
| Runtime           | Node (18.0)   |
| Entrypoint        | `src/main.js` |
| Build Commands    | `npm install` |
| Permissions       | `any`         |
| Timeout (Seconds) | 15            |

## 🔒 Environment Variables
  
### LIVEKIT_HOST

Host URL of Livekit instance.

| Question      | Answer                                       |
| ------------- | -------------------------------------------- |
| Required      | Yes                                          |
| Sample Value  | `https://******.livekit.cloud`               |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |

### LIVEKIT_API_KEY

API Key to use Livekit Server SDK.

| Question      | Answer                                       |
| ------------- | -------------------------------------------- |
| Required      | Yes                                          |
| Sample Value  | `AP......9X`                                 |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |
  
### LIVEKIT_API_SECRET

API Secret to use Livekit Server SDK.

| Question      | Answer                                       |
| ------------- | -------------------------------------------- |
| Required      | Yes                                          |
| Sample Value  | `HC1Itf...........dAAKF5o`                   |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |

### LIVEKIT_SOCKET_URL

Socket URL of Livekit instance.

| Question      | Answer                                       |
| ------------- | -------------------------------------------- |
| Required      | Yes                                          |
| Sample Value  | `wss://******.livekit.cloud`                 |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |