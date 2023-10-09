# Send OTP function

Function to send OTPs.

## 🧰 Usage

### POST /

**Parameters**

| Name           | Description               | Location | Type   | Sample Value       |
| -------------- | ------------------------- | -------- | ------ | ------------------ |
| otpId          | Document ID of the otp    | Body     | String | `jcbd...kdsn`      |
| recipientEmail | Email ID of the recipient | Body     | String | `jcbd...@mail.com` |

**Response**

Sample `200` Response:

```json
{
    "msg": "mail sent"
}
```

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

### VERIFICATION_DATABASE_ID

Database ID of verification database in appwrite.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `Zjc...5PH`                                                                             |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### OTP_COLLECTION_ID

Collection ID of otp collection.

| Question      | Answer                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Required      | Yes                                                                                     |
| Sample Value  | `NXOi3...IBHDa`                                                                         |
| Documentation | [Resonate](https://github.com/AOSSIE-Org/Resonate/blob/master/lib/utils/constants.dart) |

### SENDER_MAIL

Email of the sender.

| Question      | Answer                                           |
| ------------- | ------------------------------------------------ |
| Required      | Yes                                              |
| Sample Value  | `jsch...@mail.com`                               |
| Documentation | [Discord](https://discord.com/invite/6mFZ2S846n) |

### SENDER_PASSWORD

Password of the sender's account.

| Question      | Answer                                           |
| ------------- | ------------------------------------------------ |
| Required      | Yes                                              |
| Sample Value  | `HC1Itf...........dAAKF5o`                       |
| Documentation | [Discord](https://discord.com/invite/6mFZ2S846n) |
