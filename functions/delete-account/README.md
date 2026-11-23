# Delete Account

Erases the signed-in user's data and then their Appwrite account.

The uid comes from `x-appwrite-user-id`, the header Appwrite sets for the
authenticated caller. A uid in the request body is ignored, so the function can
only ever delete the account of whoever called it — there is nothing to forge.

Takes no body. Returns `200` with `{ msg, failures }`, `401` when the caller is
not signed in, and `500` only when the account itself could not be deleted.

## What it removes

| | |
| --- | --- |
| Stories | the story, its chapters, the likes on it, and the cover and audio files of each |
| Rooms | rooms where the user is the admin |
| Taking part | participants, poll votes, room credits, chat messages, likes |
| Pairing | pair requests, active pairs |
| People | friends, friend calls, followers (either side), user reports (either side) |
| Subscriptions | upcoming-room subscriptions |
| Profile | `user_stats`, the profile image, the username reservation, the users row |
| Account | the Appwrite auth user |

Rows that join two people are removed when either side leaves, because what
remains is half a relationship.

## Partial failures

Everything except the account deletion is best effort. A row that cannot be
removed is logged and named in `failures`, and the run continues: a user who
asked to leave should not be kept because one row refused to go. Only a failure
to delete the account itself is reported as an error, since while the account
exists the user can still sign in and would find an empty app.

## Environment

All of the table and bucket ids it touches, plus `APPWRITE_ENDPOINT`. See
`.env.example`; the values are set in `appwrite.config.json`.

Scopes: `tables.read`, `rows.read`, `rows.write`, `files.read`, `files.write`,
`users.read`, `users.write`.
