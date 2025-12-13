# Resonate - An Open Source Social Voice Platform

### This project is divided into two repositories:

1. [Resonate Flutter App](https://github.com/AOSSIE-Org/Resonate)
2. Resonate Backend (You are here)

Go to [this repository](https://github.com/AOSSIE-Org/Resonate) to know more about the project.

## Environment Setup :

1. Pre-requisites :

    (a) Fork the Repo

    (b) Clone the Repo : `git clone https://github.com/AOSSIE-Org/Resonate-Backend`

2. Follow [this guide](https://docs.livekit.io/cloud/project-management/keys-and-tokens/) to obtain your `HOST`, `API-KEY`, `API-SECRET` from [livekit-cloud](https://livekit.io/cloud).

3. Create a new project on [Appwrite Cloud](https://appwrite.io/) or self host it locally by pulling their [docker image](https://appwrite.io/docs/self-hosting). Know more about Appwrite [here](https://appwrite.io/docs).

## Project Structure :

```
Resonate-Backend/
├── appwrite.json              # Appwrite configuration file
├── Caddyfile                  # Caddy server configuration
├── README.md                  # Project documentation
├── init-auth.ps1              # PowerShell authentication initialization script
├── init-auth.sh               # Bash authentication initialization script
├── init.ps1                   # PowerShell initialization script
├── init.sh                    # Bash initialization script
└── functions/                 # Serverless functions directory
    ├── create-room/           # Room creation function
    ├── database-cleaner/      # Database cleanup function
    ├── delete-room/           # Room deletion function
    ├── join-room/             # Room joining function
    ├── livekit-webhook/       # Livekit webhook handler
    ├── match-maker/           # User matching function
    ├── send-otp/              # OTP sending function
    ├── send-story-notification/  # Story notification function
    ├── start-friend-call/     # Friend call initiation function
    ├── sync-all-documents-with-meilisearch/  # Full sync with Meilisearch
    ├── sync-stories-with-meilisearch/        # Stories sync with Meilisearch
    ├── sync-users-with-meilisearch/          # Users sync with Meilisearch
    ├── upcomingRoom-isTime-checker/          # Scheduled room time checker
    ├── upcomingRoom-Message-Notification/    # Upcoming room notifications
    ├── verify-email/          # Email verification function
    └── verify-otp/            # OTP verification function
```

Each function directory contains:
- `package.json` - Dependencies and configuration
- `README.md` - Function-specific documentation
- `src/` - Source code directory with implementation files

## Functions :

(a) [Room Creation function](functions/create-room) : Function to create rooms in Appwrite and Livekit.

(b) [Room Deletion function](functions/delete-room) : Function to remove rooms from Appwrite and Livekit.

(c) [Room Joining function](functions/join-room) : Function to join room in Livekit.

(d) [Livekit Webhook Receiver function](functions/livekit-webhook) : Function to receive webhooks from Livekit.

(e) [Match Maker function](functions/match-maker) : Function to pair users for pair-chat feature.

(f) [Send OTP function](functions/send-otp) : Function to send OTPs.

(g) [Verify OTP function](functions/verify-otp) : Function to verify OTPs.

(h) [Verify Email function](functions/verify-email) : Function to verify email ID of users.

(i) [Database Cleaner function](functions/database-cleaner) : Function to cleanup active pairs and participants collections in the database.

(j) [Send Story Notification function](functions/send-story-notification) : Function to send notifications when new stories are posted.

(k) [Start Friend Call function](functions/start-friend-call) : Function to initiate voice calls between friends.

(l) [Sync All Documents with Meilisearch function](functions/sync-all-documents-with-meilisearch) : Function to synchronize all documents with Meilisearch for search functionality.

(m) [Sync Stories with Meilisearch function](functions/sync-stories-with-meilisearch) : Function to synchronize stories with Meilisearch for search indexing.

(n) [Sync Users with Meilisearch function](functions/sync-users-with-meilisearch) : Function to synchronize user data with Meilisearch for user search.

(o) [Upcoming Room isTime Checker function](functions/upcomingRoom-isTime-checker) : A Cron function to check scheduled room timings and activate rooms when current time is within 5 minutes of scheduled time.

(p) [Upcoming Room Message Notification function](functions/upcomingRoom-Message-Notification) : Function to send message notifications for upcoming scheduled rooms.

## Communication Channels

If you have any questions, need clarifications, or want to discuss ideas, feel free to reach out through the following channels:

-   [Discord Server](https://discord.com/invite/6mFZ2S846n)
-   [Email](mailto:aossie.oss@gmail.com)

We appreciate your contributions and look forward to working with you to make this project even better!
