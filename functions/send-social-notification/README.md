# send-social-notification

Pushes a notification to **one** target user. The sibling `send-story-notification` fans out to a
creator's followers; this one is for actions whose audience is a single person — the author whose
story was liked, the user who was followed, the host whose room was subscribed to.

## Request

```json
{
  "targetUid": "6ac26c5bde17f47f2fbb",
  "payload": { "title": "New follower", "body": "alice started following you" },
  "data":    { "notificationType": "follow", "initiatorUsername": "alice" }
}
```

`payload` becomes the FCM `notification` block, so Android renders it automatically while the app
is backgrounded. `data` is optional and is passed through for the client to act on when tapped.

## Where the tokens come from

`users.fcmTokens` (string array). The app writes it in `AuthRepository.addRegistrationToken` on
login and removes the device's token on logout.

Note the older token stores — `subscribedUsers.registrationTokens` and
`upcomingRooms.creator_fcm_tokens` — are **per-row copies** of the same tokens, written by the same
method. They exist because there was no per-user column before this function needed one. Prefer
`users.fcmTokens` for anything new; the other two can be retired once the functions reading them
(`upcomingRoom-Message-Notification`, `upcomingRoom-isTime-checker`) are migrated.

## Stale tokens

A token dies when the app is reinstalled or its data is cleared, and FCM then fails that send
forever. On `registration-token-not-registered` / `invalid-registration-token` / `invalid-argument`
the function prunes the offending tokens from `users.fcmTokens`, so the list self-heals.

## Environment

| var | value |
|---|---|
| `UserDataDatabaseID` | `main` |
| `UsersCollectionID` | `64a52f0a6c41ded09def` |

Scopes: `tables.read`, `rows.read`, `rows.write` — the write is only for pruning stale tokens.

## Deploy

`src/resonate-service-account.json` is **gitignored** and must be present before deploying — copy
it from another FCM function (e.g. `start-friend-call`). Then:

```bash
appwrite push functions --function-id send-social-notification --with-variables
```

The `users.fcmTokens` column is new. Add it with a targeted command rather than a full push:

```bash
appwrite tables-db create-string-column \
  --database-id main --table-id 64a52f0a6c41ded09def \
  --key fcmTokens --size 255 --required false --array true
```
