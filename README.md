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

(j) [Send Story Notification function](functions/send-story-notification) : Function to send push notifications to all followers of a story creator when a new story is published or when there's an update related to their stories.

(k) [Start Friend Call function](functions/start-friend-call) : Function to send a high-priority FCM data message to initiate a friend call with ring/accept flow.

(l) [Sync All Documents with Meilisearch function](functions/sync-all-documents-with-meilisearch) : Function to sync documents in an Appwrite database collection to a Meilisearch index.

(m) [Sync Stories with Meilisearch function](functions/sync-stories-with-meilisearch) : Function to sync stories in an Appwrite database collection to a Meilisearch index.

(n) [Sync Users with Meilisearch function](functions/sync-users-with-meilisearch) : Function to sync users in an Appwrite database collection to a Meilisearch index.

(o) [Upcoming Room Message Notification function](functions/upcomingRoom-Message-Notification) : Function to send push notifications to all subscribers and the creator of an upcoming room when a relevant event occurs.


## Communication Channels

If you have any questions, need clarifications, or want to discuss ideas, feel free to reach out through the following channels:

-   [Discord Server](https://discord.com/invite/6mFZ2S846n)
-   [Email](mailto:aossie.oss@gmail.com)

We appreciate your contributions and look forward to working with you to make this project even better!
