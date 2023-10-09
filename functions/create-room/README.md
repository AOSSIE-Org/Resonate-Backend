# Room Creation function 
Function to create rooms in Appwrite and Livekit.

## 🧰 Usage

### POST /

Receives new room data, and creates room in Livekit and corresponding room document in Appwrite.

**Parameters**

| Name          | Description                        | Location | Type                | Sample Value         |
| ------------- | ---------------------------------- | -------- | ------------------- | -------------------- |
| name | Name of the room | Body   | String              | `sample_room` |
| description          | Room description               | Body     | String              | `Sample description`              |
| adminUid          | User ID of room admin       | Body     | String              | `652000000002`             |
| tags          | Array of room tags       | Body     | Array<String>              | `["sample-tag"]`             |
  

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
    "msg": "Room Creation failed"
}
```

## ⚙️ Configuration

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Runtime           | Node (18.0)                    |
| Entrypoint        | `src/main.js`                 |
| Build Commands    | `npm install && npm run start` |
| Permissions       | `any`                          |
| Timeout (Seconds) | 15                             |

## 🔒 Environment Variables

### APPWRITE_API_KEY

API Key to use Appwrite Sever SDK.

| Question      | Answer                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Required      | Yes                                                                                                                      |
| Sample Value  | `62...97`                                                                                                                |
| Documentation | [Appwrite API Keys](https://appwrite.io/docs/advanced/platform/api-keys) |

### MASTER_DATABASE_ID

Database ID of master database in appwrite.

| Question      | Answer                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Required      | Yes                                                                                                                      |
| Sample Value  | `Zjc...5PH`                                                                                                              |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### ROOMS_COLLECTION_ID

Collection ID of rooms collection.

| Question      | Answer                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                                            |
| Sample Value  | `NXOi3...IBHDa`                                                                                                |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |
  
### LIVEKIT_HOST

Host URL of Livekit instance.

| Question      | Answer                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                                            |
| Sample Value  | `https://******.livekit.cloud`                                                                                                |
| Documentation | [Livekit](https://docs.livekit.io/realtime/) |

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