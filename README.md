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

(a) ### Create Room

**Trigger:** HTTP (Appwrite Function)

**Description:**  
Creates a new discussion room by creating a room document in Appwrite and a corresponding room in Livekit, and generates an access token for the room admin.

**Input:**  
i) Room details such as name, admin user ID, optional description, and tags (sent in request body)

**Output:**  
i) JSON response containing room creation status, Livekit room details, socket URL, and an access token  
ii) Common errors include missing required fields or configuration issues

**Implementation:**  
`functions/create-room/`


(b) ### Delete Room

**Trigger:** HTTP (Appwrite Function)

**Description:**  
Deletes an existing room by removing the room document from Appwrite, cleaning up associated participants, and deleting the corresponding Livekit room.

**Input:**  
i) Identifier of the room to be deleted, provided in the request body

**Output:**  
i) JSON response confirming successful room deletion  
ii) Common errors include missing parameters, authorization failures, or deletion errors

**Authorization:**  
i) Only the room admin is allowed to delete a room

**Implementation:**  
`functions/delete-room/`


(c) ### Join Room

**Trigger:** HTTP (Appwrite Function)

**Description:**  
Allows a user to join an existing Livekit room by generating an access token for the specified room and user.

**Input:**  
i) Room identifier and user identifier provided in the request body

**Output:**  
i) JSON response containing the Livekit socket URL and an access token for joining the room  
ii) Common errors include missing required fields or token generation failures

**Implementation:**  
`functions/join-room/`


(d) ### Livekit Webhook Receiver

**Trigger:** Webhook (Livekit Events)

**Description:**  
Receives and validates webhook events from Livekit and performs backend actions based on the event type.

**Input:**  
i) Webhook payload sent by Livekit when room-related events occur

**Output:**  
i) JSON response indicating whether the webhook was processed successfully  
ii) Invalid or unverified webhook events are rejected

**Behavior:**  
i) On `room_finished` events, deletes the corresponding room document from Appwrite if it still exists

**Implementation:**  
`functions/livekit-webhook/`


(e) ### Match Maker

**Trigger:** Appwrite Event (Database Document Creation)

**Description:**  
Automatically pairs users for the pair-chat feature when a new matchmaking request is created in the database.

**Input:**  
i) Triggered by a database event when a new request document is added to the requests collection

**Output:**  
i) Creates an active pair entry when a compatible match is found  
ii) Removes paired request documents from the queue  
iii) Returns a status message indicating whether a match was created or the request remains queued

**Implementation:**  
`functions/match-maker/`


(f) ### Send OTP

**Trigger:** HTTP (Appwrite Function)

**Description:**  
Sends a one-time password (OTP) to a user’s email address and stores the OTP for later verification.

**Input:**  
i) `otpID`: Identifier for the OTP document  
ii) `email`: Recipient’s email address

**Output:**  
i) JSON response confirming that the OTP email was sent  
ii) Common errors include missing parameters or misconfigured environment variables

**Implementation:**  
`functions/send-otp/`


(g) ### Verify OTP

**Trigger:** HTTP (Appwrite Function)

**Description:**  
Verifies a user-provided one-time password (OTP) by comparing it with the stored OTP and records the verification result.

**Input:**  
i) OTP identifier  
ii) User-provided OTP value  
iii) Verification document identifier  

**Output:**  
i) JSON response indicating that the verification result has been recorded  
ii) Common errors include missing parameters or verification failures

**Implementation:**  
`functions/verify-otp/`


(h) ### Verify Email

**Trigger:** HTTP (Appwrite Function)

**Description:**  
Marks a user’s email address as verified by updating the user’s email verification status in Appwrite.

**Input:**  
i) User identifier whose email needs to be verified

**Output:**  
i) JSON response confirming that the email verification status has been updated  
ii) Common errors include invalid user identifiers or configuration issues

**Implementation:**  
`functions/verify-email/`


(i) ### Discussion Is-Time Checker

**Trigger:** Cron (Planned)

**Description:**  
Intended to periodically check scheduled discussion timings and update their state accordingly.

**Status:**  
i) This function is referenced in the README but no corresponding implementation or function folder currently exists in the repository.

**Note:**  
i) This entry is documented for awareness and may represent a planned or deprecated feature.


(j) ### Database Cleaner

**Trigger:** Cron (Scheduled Function)

**Schedule:**  
i) Runs daily at 01:00 (configured via cron)

**Description:**  
Performs periodic database maintenance by removing stale participant records, inactive active-pair entries, and expired OTP documents based on the configured retention policy.

**Input:**  
i) None (runs automatically on a schedule)

**Output:**  
i) Executes cleanup tasks as background operations  
ii) Logs errors if cleanup steps fail

**Implementation:**  
`functions/database-cleaner/`


## Communication Channels

If you have any questions, need clarifications, or want to discuss ideas, feel free to reach out through the following channels:

-   [Discord Server](https://discord.com/invite/6mFZ2S846n)
-   [Email](mailto:aossie.oss@gmail.com)

We appreciate your contributions and look forward to working with you to make this project even better!
