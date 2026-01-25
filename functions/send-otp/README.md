# Send OTP Function

This function handles the generation and delivery of a 6-digit OTP via email. It includes a **60-second backend rate-limiting** mechanism to prevent abuse.

## 🚀 Features
- **Secure OTP Generation**: Creates a random 6-digit code for authentication.
- **Rate Limiting**: Checks the `last_otp_sent` timestamp in the database; returns a **429 Too Many Requests** if a request is made within 60 seconds of the last one.
- **Email Integration**: Delivers the OTP using SMTP with secure credentials.

## ⚙️ Configuration
- **Runtime**: Node.js 18.0 (Updated to address security patches)
- **Entrypoint**: `src/main.js`

## 🔐 Environment Variables
The following variables must be configured in your Appwrite Function settings:

| Variable | Description |
|----------|-------------|
| `APPWRITE_API_KEY` | API key with database and document scopes. |
| `APPWRITE_FUNCTION_PROJECT_ID` | Your active project ID. |
| `VERIFICATION_DATABASE_ID` | ID for the database storing OTP metadata. |
| `OTP_COLLECTION_ID` | Collection ID for storing user-specific OTP records. |
| `SENDER_MAIL` | The SMTP email address used to send the OTP. |
| `SENDER_PASSWORD` | The SMTP password or App Password for the sender. |