# Live Chapter Room Deletion Function 
Function to delete live chapter rooms from Livekit.

## 🧰 Usage

### POST /

Receives the Appwrite room document ID and deletes the corresponding Livekit room.

**Parameters**

| Name              | Description                              | Location | Type   | Sample Value   |
| ----------------- | ---------------------------------------- | -------- | ------ | -------------- |
| appwriteRoomDocId | Appwrite document ID of the chapter/room | Body     | String | `68c3b9910...` |
  

**Response**

Sample `200` Response:

```json
{
    "msg": "Room deleted successfully"
}
```

Sample `400` Response:

```json
{
    "msg": "Missing required parameter: appwriteRoomDocId"
}
```

Sample `500` Response:

```json
{
    "msg": "Room deletion failed"
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
