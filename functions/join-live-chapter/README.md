# Join Live Chapter Function 
Function to generate access tokens for users to join live chapter storytelling sessions in Livekit.

## 🧰 Usage

### POST /

Receives the room name (chapter ID) and user ID, then generates and returns an access token for the user to join the live chapter session.

**Parameters**

| Name     | Description                              | Location | Type   | Sample Value   |
| -------- | ---------------------------------------- | -------- | ------ | -------------- |
| roomName | Appwrite document ID of the chapter/room | Body     | String | `68c3b9910...` |
| uid      | User ID who wants to join                | Body     | String | `6899f2740...` |
  

**Response**

Sample `200` Response:

```json
{
    "msg": "Success",
    "livekit_socket_url": "livekitSocketUrl",
    "access_token": "accessToken",
}
```

Sample `400` Response:

```json
{
    "msg": "Missing required parameter: roomName"
}
```

Sample `500` Response:

```json
{
    "msg": "Error joining room"
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