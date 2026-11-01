# Resonate - An Open Source Social Voice Platform

### This project is divided into two repositories:

1. [Resonate Flutter App](https://github.com/AOSSIE-Org/Resonate)
2. Resonate Backend (You are here)

Go to [this repository](https://github.com/AOSSIE-Org/Resonate) to know more about the project.

## Environment Setup :

`init.sh` (or `init.ps1` on Windows) builds the whole backend for you: it installs Appwrite,
creates the project, pushes every table, bucket and function defined in `appwrite.config.json`, and
starts Meilisearch and LiveKit locally. Two steps need a browser and are called out below.

### Prerequisites

-   **Docker** running, with roughly 8 GB of RAM available. Appwrite starts around 25 containers.
-   **Node.js 18+** — the script installs the Appwrite CLI through npm.
-   Ports **80**, **7700** (Meilisearch), **7880** (LiveKit) and **20080** (installer) free.

```bash
git clone https://github.com/AOSSIE-Org/Resonate-Backend
cd Resonate-Backend
```

### Run the setup

```bash
./init.sh          # macOS / Linux / Git Bash
.\init.ps1         # Windows PowerShell
```

The script pauses once, for the one thing Appwrite will not let a script do:

**Create your console account.** When prompted, open <http://localhost> and sign up. A fresh
instance has no accounts and the CLI cannot register one. Then log in at the terminal prompt with
those same credentials.

Everything else runs unattended. Expect 5–15 minutes, most of it building the 21 functions.

> **No API key needed.** Each function authenticates with the per-execution key Appwrite supplies
> in the `x-appwrite-key` header, scoped to the `scopes` that function declares in `appwrite.config.json`.
> Nothing long-lived has to be created, pasted or kept in sync.

### Verify it worked

```bash
appwrite functions list     # 21 functions, all "ready"
appwrite tablesdb list-rows --database-id main --table-id achievement_thresholds
```

The thresholds table should hold 9 rows. If it is empty, check the failing execution:

```bash
appwrite functions list-executions --function-id reconcile-achievements
```

An authorization error there usually means the function is missing a scope. Scopes live per
function in `appwrite.config.json` and decide what its per-execution key may do, so add the missing one
and redeploy — **a function keeps the environment and scopes it was deployed with**:

```bash
appwrite push functions --all --force --with-variables
```

### Connecting the app

Point the Flutter app at your machine's LAN IP (not `localhost`, which a device or emulator
resolves to itself):

```bash
flutter run --dart-define=APPWRITE_BASE_DOMAIN=192.168.1.x
```

### Using hosted services instead

The script asks whether you want Meilisearch and LiveKit locally or in the cloud. For LiveKit
Cloud, follow [this guide](https://docs.livekit.io/cloud/project-management/keys-and-tokens/) to
get your `HOST`, `API-KEY` and `API-SECRET` first. Appwrite itself can also run on
[Appwrite Cloud](https://appwrite.io/) rather than locally — see the
[self-hosting docs](https://appwrite.io/docs/self-hosting).

### Changing the schema

`appwrite.config.json` is the source of truth for every database, table, index and function. After
editing it:

```bash
appwrite push tables --all --force
```

Read the plan it prints before confirming. `adding` is safe; treat **`deleting`** or
**`recreating`** as a stop sign, because those drop data.

### Pushing to a different instance

The committed `projectId` is `resonate`, the id `init.sh` creates, so a local setup needs no
edit. To push the same config at another instance (a staging or production server, whose project
id is generated and not `resonate`), override it for the one command instead of editing the file:

```bash
appwrite login --switch --email <you> --endpoint https://<host>/v1
APPWRITE_PROJECT_ID=<project-id> appwrite push functions --all --force --with-variables
```

`APPWRITE_PROJECT_ID` takes precedence over the file, which keeps one config in git rather than a
per-environment copy. Without it the push targets `resonate` and fails with *"Project with the
requested ID could not be found"* — a harmless error, not a wrong-instance write.

### Function config and secrets

Two kinds of value reach a function, and they live in different places.

**Per-function config — `functions/<name>/.env`.** Database, table and collection IDs. These are
not secrets (the same IDs ship inside the Flutter app), but they are environment-specific, so they
are **not committed**. Each function has a committed `.env.example`; copy them before setup:

```bash
for f in functions/*/.env.example; do cp -n "$f" "${f%.example}"; done
```

```powershell
Get-ChildItem functions/*/.env.example | ForEach-Object {
  $t = $_.FullName -replace '\.example$',''
  if (-not (Test-Path $t)) { Copy-Item $_.FullName $t }
}
```

`appwrite push functions --with-variables` reads these files. **If a function has no `.env`, that
command pushes zero variables and silently wipes any already set**, and the function then fails at
runtime with an unhelpful `Missing required parameter: "databaseId"`.

**Shared secrets — project variables.** Credentials belong on the server, never in a file.
`init.sh` / `init.ps1` prompt for them and store them with `appwrite project create-variable`,
which makes them visible to every function and immune to the wipe above. The LiveKit and
Meilisearch keys already work this way.

`functions/send-otp/.env.example` leaves `SENDER_MAIL` and `SENDER_PASSWORD` blank on purpose.
Supply **your own** Gmail address and a [Google App Password](https://myaccount.google.com/apppasswords).
OTP email does not work without them, and sharing one mailbox between contributors is not intended.

**Firebase credential.** `send-story-notification`, `start-friend-call`,
`upcomingRoom-Message-Notification` and `upcomingRoom-isTime-checker` each `require` a
`src/resonate-service-account.json`. It is gitignored, so a fresh clone has none and those
functions crash at load with `Cannot find module`. Put your Firebase service-account JSON in
**each** of those four directories. (`send-social-notification` instead reads a
`FIREBASE_SERVICE_ACCOUNT` project variable, which avoids the per-directory copying.)

## Functions :

(a) [Room Creation function](functions/create-room) : Function to create rooms in Appwrite and Livekit.

(b) [Room Deletion function](functions/delete-room) : Function to remove rooms from Appwrite and Livekit.

(c) [Room Joining function](functions/join-room) : Function to join room in Livekit.

(d) [Livekit Webhook Receiver function](functions/livekit-webhook) : Function to receive webhooks from Livekit.

(e) [Match Maker function](functions/match-maker) : Function to pair users for pair-chat feature.

(f) [Send OTP function](functions/send-otp) : Function to send OTPs.

(g) [Verify OTP function](functions/verify-otp) : Function to verify OTPs.

(h) [Verify Email function](functions/verify-email) : Function to verify email ID of users.

(i) [database-cleaner](functions/database-cleaner/) : Function to cleanup active pairs and participants collections in the database.

(j) [send-story-notification](functions/send-story-notification/) : Function to send notifications when stories are posted or updated (notifies followers or relevant users).

(k) [start-friend-call](functions/start-friend-call/) : Function to initiate a direct friend-to-friend voice call, creating/joining LiveKit sessions and updating call records.

(l) [sync-all-documents-with-meilisearch](functions/sync-all-documents-with-meilisearch/) : Function to synchronize all relevant database collections and documents with Meilisearch indices for global search availability.

(m) [sync-stories-with-meilisearch](functions/sync-stories-with-meilisearch/) : Function to keep story documents in sync with the Meilisearch index so stories are searchable.

(n) [sync-users-with-meilisearch](functions/sync-users-with-meilisearch/) : Function to index and synchronize user documents with Meilisearch for user search and discovery.

(o) [upcomingRoom-isTime-checker](functions/upcomingRoom-isTime-checker/) : Cron function to check scheduled upcoming rooms and activate or mark them ready when their start time is near.

(p) [upcomingRoom-Message-Notification](functions/upcomingRoom-Message-Notification/) : Function to send reminders/notifications to users about upcoming rooms (e.g., reminders before start time).

(q) [create-live-chapter-room](functions/create-live-chapter-room/) : Function to create live chapter rooms in LiveKit for real-time storytelling sessions.

(r) [join-live-chapter](functions/join-live-chapter/) : Function to generate access tokens for users joining a live chapter storytelling session in LiveKit.

(s) [delete-live-chapter-room](functions/delete-live-chapter-room/) : Function to delete live chapter rooms from LiveKit.

(t) [record-activity](functions/record-activity/) : Function to record user activity counters (rooms hosted, rooms moderated, interactions, active days) and award achievement badges. The only writer of the `user_stats` table.

(u) [reconcile-achievements](functions/reconcile-achievements/) : Nightly cron function that seeds the badge threshold catalogue and repairs any badge award the event-driven path missed.

## Communication Channels

If you have any questions, need clarifications, or want to discuss ideas, feel free to reach out through the following channels:

-   [Discord Server](https://discord.com/invite/6mFZ2S846n)
-   [Email](mailto:aossie.oss@gmail.com)

We appreciate your contributions and look forward to working with you to make this project even better!
