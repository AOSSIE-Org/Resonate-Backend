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

`payload` becomes the push `notification` block, so the native Appwrite plugin renders it while
the app is closed. `data` is optional and is passed through for the client to act on. The function
also copies `title`/`body` **into** `data`, because the plugin renders the notification itself but
the Dart callback only ever sees the payload.

Every `data` value is stringified (`String(v)`), so a boolean arrives as `"true"`, not `true`.

## How a device is addressed

By **user id**. There are no device tokens anywhere. `createPush({users: [targetUid]})` publishes
to the broker topic `users/<targetUid>`, and the app subscribes to its own topic with
`push.subscribe(null, ...)`. Nothing is stored on login or cleaned up on logout, so the seven
per-user and per-row token columns this design used to need have all been dropped from the schema.

## Environment

| var | value |
|---|---|
| `UserDataDatabaseID` | `main` |
| `UsersCollectionID` | `64a52f0a6c41ded09def` |

Scopes: `tables.read`, `rows.read`, `messages.write`.

## Deploy

No credential file is needed. The instance does need an enabled push provider, see the root
README.

```bash
appwrite push functions --function-id send-social-notification
```

A 200 from `createPush` means **queued**, not delivered. Check it with
`appwrite messaging get-message --message-id <id>`.
