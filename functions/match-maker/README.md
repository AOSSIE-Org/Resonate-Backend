# Match Maker function

Function to pair users for pair-chat feature.

## ⚙️ Configuration

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Runtime           | Node (18.0)                    |
| Entrypoint        | `src/main.js`                  |
| Build Commands    | `npm install && npm run start` |
| Permissions       | `Users`                        |
| Timeout (Seconds) | 15                             |

## 🔒 Environment Variables

### APPWRITE_API_KEY

API Key to use Appwrite Sever SDK.

| Question      | Answer                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| Required      | Yes                                                                      |
| Sample Value  | `62...97`                                                                |
| Documentation | [Appwrite API Keys](https://appwrite.io/docs/advanced/platform/api-keys) |

### DATABASE_ID

Database ID of master database in appwrite.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `Zjc...5PH`                                                                             |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### REQUESTS_COLLECTION_ID

Collection ID of requests collection.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `NXOi3...IBHDa`                                                                         |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### ACTIVE_PAIRS_COLLECTION_ID

Collection ID of active_pairs collection.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `NXOi3...IBHDa`                                                                         |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |
