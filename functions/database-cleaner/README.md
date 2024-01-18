Database Cleaner Function

Function to cleanup active pairs and participants collections in the database.

## 🧰 Usage

### GET /

Remove documents older than X days from the active_pairs collection and stale participants documents.

**Response**

Sample `200` Response: Database Cleanup completed

## ⚙️ Configuration

| Setting           | Value                          |
| ----------------- | ------------------------------ |
| Runtime           | Node (18.0)                    |
| Entrypoint        | `src/main.js`                  |
| Build Commands    | `npm install && npm run start` |
| Permissions       | `any`                          |
| CRON              | `0 1 * * *`                    |
| Timeout (Seconds) | 900                            |

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

### ACTIVE_PAIRS_COLLECTION_ID

Collection ID of active_pairs collection.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `NXOi3...IBHDa`                                                                         |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### RETENTION_PERIOD_DAYS

The number of days you want to retain the active pair document.

| Question     | Answer |
| ------------ | ------ |
| Required     | Yes    |
| Sample Value | `1`    |
