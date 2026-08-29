# Record Activity Function

The single write path for the user stats & gamification system: it moves the activity counters, re-evaluates badge eligibility against the configurable thresholds, and stores the result on the user's stats row.

`user_stats` is readable by anyone but **writable only with the server API key**, so every counter has to come through this function. That is what lets a room creator treat a badge as evidence when deciding whether to hand a stranger the moderator role.

## Usage
Invoke with a JSON body containing an `action`. The caller is always taken from the `x-appwrite-user-id` header that Appwrite sets for an authenticated execution — a `uid` in the body is ignored, so nobody can award another account.

### `{ "action": "activity", "interactions": 1 }`
Marks the caller active today (UTC) and adds interactions. Called on app start with no `interactions`, and whenever the user chats or votes in a poll.

- `activeDays` increments **at most once per UTC day**, so a chatty client cannot inflate it.
- `currentStreak` continues when the previous active day was yesterday, otherwise resets to 1. `longestStreak` only ever grows.
- `interactions` is capped at `DAILY_INTERACTION_CAP` per day. Chat and poll interactions can't be verified server-side the way room roles can, so the cap is what bounds the damage a spammer can do — the worst they get is one honest day's worth.

### `{ "action": "roomCredit", "roomId": "..." }`
Grants one hosting **or** moderation credit for a room that has more than five people in it.

Everything the client claims is re-derived here: the room's `adminUid`, the caller's participant row, and the live participant count. The client only says *when* to look, which is why it can run off a plain UI signal without being trusted.

- The room's admin gets a **hosting** credit. The host is a moderator too, but hosting and moderation are separate signals in the spec, so crediting both would double-count one room.
- A participant whose row has `isModerator: true` gets a **moderation** credit.
- A room counts **once per user per role**, enforced by a deterministic `room_credits` row id — a duplicate call is a 409 on that row, not a second point.

### `{ "action": "display", "displayedBadges": ["icon"], "avatarBadge": "warden" }`
Chooses what the user shows off: up to two pill badges next to their name plus one badge worn on the avatar. Both are validated against the badges actually earned, and both are pruned automatically if a badge is ever retired from the catalogue.

Picking is not a prerequisite for being seen. A newly earned badge is added to the pills automatically while there is room, because a badge nobody chose to display is a badge the user never learns they have. Clearing the pills by hand sticks — the auto-fill only ever runs at the moment a badge is earned, so a later call that earns nothing leaves the choice alone.

### `{ "action": "read" }`
Returns the stats row, creating it if this is the user's first ever call. No signup hook is needed.

## Badge assignment
Thresholds live as rows in the `achievement_thresholds` table so they can be tuned without a deploy. `src/achievements.js` carries the same catalogue as a built-in default, used to seed a fresh install (see **Reconcile Achievements**) and as a fallback if the table can't be read — a broken read must not silently stop awarding anyone anything.

| Category | Metric | Badges |
| --- | --- | --- |
| `hosting` | `roomsHosted` | Welcomer 10 → Icon 25 → Maestro 50 |
| `moderation` | `roomsModerated` | Guard 10 → Sentinel 25 → Warden 50 |
| `echo` | `interactions` | Echo 50 |
| `rhythm` | `longestStreak` | Rhythm 7 |
| `core` | `activeDays` | Core 30 |

A category holds **at most one** badge — the highest tier the metric qualifies for — so crossing 25 hosted rooms upgrades Welcomer to Icon rather than adding to it.

An upgrade **takes the slot of the badge it replaced**, on the pills and on the avatar alike. Without that, being promoted from Welcomer to Icon would drop Welcomer out of `displayedBadges` (it is no longer held) and leave the user showing nothing — getting better at something would take the badge off their profile.

Badges are **never revoked**. A broken streak or a threshold an admin raised must not take one away, matching the spec's "once assigned, the badge is stored in the user profile". Rhythm is measured against `longestStreak` rather than `currentStreak` for the same reason, so no revocation special case is needed anywhere. A badge removed from the catalogue *is* dropped, which is how a badge gets retired.

## Responses
All responses are JSON.

| Status | Body | When |
| --- | --- | --- |
| 200 | `{ "stats": {...}, "newBadges": ["icon"] }` | Success. `newBadges` is what this call earned, so the client can celebrate it |
| 200 | `{ "stats": {...}, "newBadges": [], "credited": true }` | `roomCredit` granted |
| 200 | `{ "stats": {...}, "newBadges": [], "credited": false, "reason": "..." }` | `roomCredit` refused — see below |
| 400 | `{ "msg": "Malformed request body" }` | Body is not valid JSON |
| 400 | `{ "msg": "Missing roomId" }` | `roomCredit` without a `roomId` |
| 400 | `{ "msg": "Unknown action: ..." }` | Unrecognised `action` |
| 400 | `{ "msg": "Cannot display a badge that has not been earned" }` | Invalid showcase pick |
| 401 | `{ "msg": "Not signed in" }` | No `x-appwrite-user-id` header |
| 500 | `{ "msg": "Could not record activity" }` | Unexpected failure |

A refused `roomCredit` is **200 with a `reason`**, not a 4xx. The client fires it off the participant count going up, so `tooSmall` (the room shrank again), `notEligible` (a plain listener asked), `roomNotFound` and `alreadyCredited` are all ordinary outcomes rather than errors. This is the same reasoning as the friend-call presence gate: the shared `Functions.execute()` helper throws on any status >= 400, so an expected refusal has to come back as a 200 the client can read.

| `reason` | Meaning |
| --- | --- |
| `tooSmall` | Fewer than `MIN_ROOM_PARTICIPANTS` in the room right now |
| `notEligible` | The caller is neither the room's admin nor a moderator in it |
| `roomNotFound` | The room row is gone (it ended before the call landed) |
| `alreadyCredited` | This room already counted for this user in this role |

## Environment variables
| Key | Meaning |
| --- | --- |
| `USER_DATA_DATABASE_ID` | Database holding `user_stats`, `achievement_thresholds` and `room_credits` |
| `USER_STATS_TABLE_ID` | `user_stats` |
| `THRESHOLDS_TABLE_ID` | `achievement_thresholds` |
| `ROOM_CREDITS_TABLE_ID` | `room_credits` |
| `MASTER_DATABASE_ID` | Database holding rooms and participants |
| `ROOMS_TABLE_ID` | Rooms table, for `adminUid` |
| `PARTICIPANTS_TABLE_ID` | Participants table, for the live count and the moderator check |
| `MIN_ROOM_PARTICIPANTS` | Room size that earns a credit — `6`, i.e. the spec's "more than 5 people" |
| `DAILY_INTERACTION_CAP` | Interactions counted per user per day (`100`) |

`APPWRITE_API_KEY` and `APPWRITE_ENDPOINT` come from the project-wide variables set up by `init.sh`.

## Known gap
Every table in this project is `read("any")`, so a determined client can read anyone's raw counters directly. That is fine — the counters are meant to be public. What matters is that they can only be *written* here.
