# Livekit Webhook Receiver function

Function to receive webhooks from Livekit.

## ⚙️ Configuration

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Runtime           | Node (18.0)                    |
| Entrypoint        | `src/main.js`                  |
| Build Commands    | `npm install && npm run start` |
| Permissions       | `any`                          |
| Timeout (Seconds) | 15                             |

## 🔒 Environment Variables

### APPWRITE_API_KEY

API Key to use Appwrite Sever SDK.

| Question      | Answer                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| Required      | Yes                                                                      |
| Sample Value  | `62...97`                                                                |
| Documentation | [Appwrite API Keys](https://appwrite.io/docs/advanced/platform/api-keys) |

### MASTER_DATABASE_ID

Database ID of master database in appwrite.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `Zjc...5PH`                                                                             |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### ROOMS_COLLECTION_ID

Collection ID of rooms collection.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `NXOi3...IBHDa`                                                                         |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### PARTICIPANTS_COLLECTION_ID

Collection ID of participants collection.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `NXOi3...IBHDa`                                                                         |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

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
