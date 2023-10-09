# Room Joining function 
Function to join room in Livekit.

## 🧰 Usage

### POST /

Receives IDs of the room and user, and sends back the necessary access to the user.

**Parameters**

| Name          | Description                        | Location | Type                | Sample Value         |
| ------------- | ---------------------------------- | -------- | ------------------- | -------------------- |
| roomName | Name of the room | Body   | String              | `jcbd...kdsn` |
| uid | User ID | Body   | String              | `dfge...ythr` |
  

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

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Runtime           | Node (18.0)                    |
| Entrypoint        | `src/main.js`                 |
| Build Commands    | `npm install && npm run start` |
| Permissions       | `Users`                          |
| Timeout (Seconds) | 15                             |

## 🔒 Environment Variables

### LIVEKIT_API_KEY

API Key to use Livekit Server SDK.

| Question      | Answer                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                                                           |
| Sample Value  | `AP......9X`                                                                                                                 |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |
  
### LIVEKIT_API_SECRET

API Secret to use Livekit Server SDK.

| Question      | Answer                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                                            |
| Sample Value  | `HC1Itf...........dAAKF5o`                                                                                                |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |

### LIVEKIT_SOCKET_URL

Socket URL of Livekit instance.

| Question      | Answer                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                                            |
| Sample Value  | `wss://******.livekit.cloud`                                                                                                |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |