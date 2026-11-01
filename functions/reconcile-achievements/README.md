# Reconcile Achievements Function

The nightly fallback for the event-driven badge awards in **Record Activity**, plus the seeder for the threshold catalogue.

Badges are normally assigned the moment a counter moves, so on a healthy day this job changes nothing and simply logs `Reconciled 0 of N stats rows`.

## Schedule
`0 3 * * *` — daily at 03:00 UTC. Takes no request body; it can also be run by hand from the console after editing thresholds.

## What it does
1. **Seeds `achievement_thresholds`** from the built-in catalogue in `src/achievements.js` if the table is empty. This is what gives a fresh backend a working catalogue without anyone running a data migration, and it is idempotent — the badge id is the row id, so a re-run is a 409 per row and a no-op overall.
2. **Sweeps every `user_stats` row**, paging with a cursor, and repairs:
   - badges an execution missed because it failed after writing its counter;
   - badges that became eligible when an admin lowered a threshold;
   - badges retired from the catalogue, which are dropped;
   - showcased badges (`displayedBadges`, `avatarBadge`) that are no longer earned;
   - a stale daily interaction allowance left over from an earlier day, which would otherwise silently block a user's interactions from counting.

Rows that need no change are not written. A row that fails to update is logged and skipped so one bad row can't abort the sweep.

## What it deliberately does not do
**Counters are never recomputed.** Once a room is deleted there is no historical record to recompute `roomsHosted` or `roomsModerated` from, and `interactions` has no event log by design. Only badge assignment and the showcase are reconciled — the counters themselves are the source of truth, exactly as the spec describes.

For the same reason a badge is **never revoked** here: raising a threshold does not take a badge off the users who already hold it.

## Responses
| Status | Body | When |
| --- | --- | --- |
| 200 | `{ "scanned": 812, "repaired": 0, "seeded": 0 }` | Normal run |
| 200 | `{ "scanned": 0, "repaired": 0, "seeded": 9 }` | First run on a fresh backend |
| 500 | `{ "msg": "Reconciliation failed" }` | Unexpected failure |

## Environment variables
| Key | Meaning |
| --- | --- |
| `USER_DATA_DATABASE_ID` | Database holding `user_stats` and `achievement_thresholds` |
| `USER_STATS_TABLE_ID` | `user_stats` |
| `THRESHOLDS_TABLE_ID` | `achievement_thresholds` |

`APPWRITE_API_KEY` and `APPWRITE_ENDPOINT` come from the project-wide variables set up by `init.sh`.

## Note on the shared modules
`src/achievements.js`, `src/stats.js` and `src/utils.js` are byte-identical copies of the ones in `functions/record-activity/`. Appwrite deploys each function directory on its own, so there is no way to share a module between them — if you change the catalogue or the badge rules, change **both** copies.
