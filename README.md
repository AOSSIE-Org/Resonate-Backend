# Resonate - An Open Source Social Voice Platform

### This project is divided into two repositories:

1. [Resonate Flutter App](https://github.com/AOSSIE-Org/Resonate)
2. Resonate Backend (You are here)

Go to [this repository](https://github.com/AOSSIE-Org/Resonate) to know more about the project.

## Environment Setup

1. Pre-requisites

    (a) Fork the Repo

    (b) Clone the Repo: `git clone https://github.com/AOSSIE-Org/Resonate-Backend`

2. Follow this guide to obtain your Livekit credentials

- Guide: https://docs.livekit.io/cloud/project-management/keys-and-tokens/
- You will need `LIVEKIT_HOST`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

3. Set up environment variables

```bash
cp .env.example .env
```

Windows:

```powershell
Copy-Item .env.example .env
```

or (CMD):

```cmd
copy .env.example .env
```

Then fill in the values in `.env`:
- Leave the database/collection IDs as they are (they match the project structure)
- Add your Livekit credentials (see step 2)
- Add your email credentials (see step 5)

4. Set up Appwrite

- Create a new project on [Appwrite Cloud](https://appwrite.io/) or self host it locally by pulling their [docker image](https://appwrite.io/docs/self-hosting). Know more about Appwrite [here](https://appwrite.io/docs).
- Create an API key with necessary scopes.
- Import the database structure: `appwrite deploy collection`.
- Copy the generated database and collection IDs into your `.env` file.
- Important: Appwrite functions do not read from your local `.env`. You must set function variables in Appwrite:
  - Console: Go to Project → Functions → Select a function → Settings → Variables → add keys/values.
  - CLI example:
    - `appwrite client --endpoint https://cloud.appwrite.io/v1 --projectId <PROJECT_ID> --key <API_KEY>`
    - `appwrite functions update --functionId <FUNCTION_ID> --vars APPWRITE_API_KEY=<...>,VERIFICATION_DATABASE_ID=<...>,OTP_COLLECTION_ID=<...>,SENDER_MAIL=<...>,SENDER_PASSWORD=<...>`

5. Email configuration (for OTP functionality)

- Set `SENDER_MAIL` to your email address.
- Set `SENDER_PASSWORD` to your app password (Gmail guide: https://support.google.com/accounts/answer/185833?hl=en).

6. Security note

- Do not hardcode secrets in `appwrite.json`. Use environment variables. The template `.env.example` lists all variables required across functions.
- Note: `appwrite.json` does not read from `.env`. Set function variables in the Appwrite Console (or via Appwrite CLI) for cloud execution; `.env` is for local configuration/reference.
- Tip: Keep `.env` as a convenient record of values; replicate them into Appwrite Function Variables for actual use.

## Functions :

(a) [Room Creation function](functions/create-room) : Function to create rooms in Appwrite and Livekit.

(b) [Room Deletion function](functions/delete-room) : Function to remove rooms from Appwrite and Livekit.

(c) [Room Joining function](functions/join-room) : Function to join room in Livekit.

(d) [Livekit Webhook Receiver function](functions/livekit-webhook) : Function to receive webhooks from Livekit.

(e) [Match Maker function](functions/match-maker) : Function to pair users for pair-chat feature.

(f) [Send OTP function](functions/send-otp) : Function to send OTPs.

(g) [Verify OTP function](functions/verify-otp) : Function to verify OTPs.

(h) [Verify Email function](functions/verify-email) : Function to verify email ID of users.

(i) [discussion-isTime-checker](functions/discussion-isTime-checker/) : A Cron Function to check all the existent Discussion scheduled timings and comparing to current time in order to activate a discussion if the current time is less than 5 minutes away from the scheduled time

(j) [database-cleaner](functions/database-cleaner/) : Function to cleanup active pairs and participants collections in the database.

(k) [send-story-notification](functions/send-story-notification/) : Function to send notifications when stories are posted or updated (notifies followers or relevant users).

(l) [start-friend-call](functions/start-friend-call/) : Function to initiate a direct friend-to-friend voice call, creating/joining LiveKit sessions and updating call records.

(m) [sync-all-documents-with-meilisearch](functions/sync-all-documents-with-meilisearch/) : Function to synchronize all relevant database collections and documents with Meilisearch indices for global search availability.

(n) [sync-stories-with-meilisearch](functions/sync-stories-with-meilisearch/) : Function to keep story documents in sync with the Meilisearch index so stories are searchable.

(o) [sync-users-with-meilisearch](functions/sync-users-with-meilisearch/) : Function to index and synchronize user documents with Meilisearch for user search and discovery.

(p) [upcomingRoom-isTime-checker](functions/upcomingRoom-isTime-checker/) : Cron function to check scheduled upcoming rooms and activate or mark them ready when their start time is near.

(q) [upcomingRoom-Message-Notification](functions/upcomingRoom-Message-Notification/) : Function to send reminders/notifications to users about upcoming rooms (e.g., reminders before start time).

## Communication Channels

If you have any questions, need clarifications, or want to discuss ideas, feel free to reach out through the following channels:

-   [Discord Server](https://discord.com/invite/6mFZ2S846n)
-   [Email](mailto:aossie.oss@gmail.com)

We appreciate your contributions and look forward to working with you to make this project even better!
