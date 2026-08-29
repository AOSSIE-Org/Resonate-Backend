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

(r) [record-activity](functions/record-activity/) : Function to record user activity counters (rooms hosted, rooms moderated, interactions, active days) and award achievement badges. The only writer of the `user_stats` table.

(s) [reconcile-achievements](functions/reconcile-achievements/) : Nightly cron function that seeds the badge threshold catalogue and repairs any badge award the event-driven path missed.

## Communication Channels

If you have any questions, need clarifications, or want to discuss ideas, feel free to reach out through the following channels:

-   [Discord Server](https://discord.com/invite/6mFZ2S846n)
-   [Email](mailto:aossie.oss@gmail.com)

We appreciate your contributions and look forward to working with you to make this project even better!
