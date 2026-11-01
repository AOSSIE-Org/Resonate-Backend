import { Client, TablesDB, Storage, Users, Query } from "node-appwrite";
import { throwIfMissing } from "./utils.js";

const PAGE = 100;

// Rows the user owns outright, as [tableId, column] pairs. Each is deleted
// wherever that column carries their uid.
const OWNED_BY_UID = (env) => [
    [env.PARTICIPANTS_TABLE_ID, "uid"],
    [env.POLL_VOTES_TABLE_ID, "uid"],
    [env.ROOM_CREDITS_TABLE_ID, "uid"],
    [env.MESSAGES_TABLE_ID, "creatorId"],
    [env.LIKES_TABLE_ID, "uId"],
    [env.PAIR_REQUESTS_TABLE_ID, "uid"],
    [env.SUBSCRIBED_USERS_TABLE_ID, "userID"],
    [env.LIVE_CHAPTERS_TABLE_ID, "authorUid"],
    [env.ROOMS_TABLE_ID, "adminUid"],
];

// Rows that join two people. Either side being deleted removes the row,
// because what is left is half a relationship.
const OWNED_BY_EITHER = (env) => [
    [env.FRIENDS_TABLE_ID, ["senderId", "recieverId"]],
    [env.FRIEND_CALLS_TABLE_ID, ["callerUid", "recieverUid"]],
    [env.ACTIVE_PAIRS_TABLE_ID, ["uid1", "uid2"]],
    [env.FOLLOWERS_TABLE_ID, ["followerUserId", "followedUid"]],
    [env.USER_REPORTS_TABLE_ID, ["reporterUid", "reportedUid"]],
];

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "DATABASE_ID",
        "USERS_TABLE_ID",
        "USERNAMES_TABLE_ID",
        "USER_STATS_TABLE_ID",
        "PARTICIPANTS_TABLE_ID",
        "POLL_VOTES_TABLE_ID",
        "ROOM_CREDITS_TABLE_ID",
        "MESSAGES_TABLE_ID",
        "LIKES_TABLE_ID",
        "PAIR_REQUESTS_TABLE_ID",
        "SUBSCRIBED_USERS_TABLE_ID",
        "LIVE_CHAPTERS_TABLE_ID",
        "ROOMS_TABLE_ID",
        "FRIENDS_TABLE_ID",
        "FRIEND_CALLS_TABLE_ID",
        "ACTIVE_PAIRS_TABLE_ID",
        "FOLLOWERS_TABLE_ID",
        "USER_REPORTS_TABLE_ID",
        "STORIES_TABLE_ID",
        "CHAPTERS_TABLE_ID",
        "USER_IMAGES_BUCKET_ID",
        "STORIES_BUCKET_ID",
    ]);

    const env = process.env;
    const client = new Client()
        .setEndpoint(env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1")
        .setProject(env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(req.headers["x-appwrite-key"]);

    const tables = new TablesDB(client);
    const storage = new Storage(client);
    const users = new Users(client);

    // Whoever Appwrite authenticated. A uid in the body is deliberately
    // ignored, so this can only ever delete the caller's own account.
    const uid = req.headers["x-appwrite-user-id"];
    if (!uid) return res.json({ msg: "Not signed in" }, 401);

    const db = env.DATABASE_ID;
    const failures = [];

    // Everything below the account deletion is best effort: a row that cannot
    // be removed must not keep the account alive, or a user who asked to leave
    // stays stuck. What failed is logged and returned.
    const attempt = async (what, fn) => {
        try {
            return await fn();
        } catch (e) {
            error(`${what}: ${e.message}`);
            failures.push(what);
            return null;
        }
    };

    const deleteRows = async (tableId, queries, label) => {
        if (!tableId) return 0;
        let removed = 0;
        // Re-querying from the start each time, because the rows just deleted
        // are gone and an offset would step over their replacements.
        for (;;) {
            const page = await tables.listRows({
                databaseId: db,
                tableId,
                queries: [...queries, Query.limit(PAGE)],
            });
            if (page.rows.length === 0) break;
            for (const row of page.rows) {
                await tables.deleteRow({
                    databaseId: db,
                    tableId,
                    rowId: row.$id,
                });
                removed++;
            }
            if (page.rows.length < PAGE) break;
        }
        if (removed) log(`${label}: removed ${removed}`);
        return removed;
    };

    const deleteFile = (bucketId, fileId) =>
        attempt(`file ${fileId}`, () =>
            storage.deleteFile({ bucketId, fileId })
        );

    let profile = null;
    await attempt("read profile", async () => {
        profile = await tables.getRow({
            databaseId: db,
            tableId: env.USERS_TABLE_ID,
            rowId: uid,
        });
    });

    // Stories first: their chapters, likes and files hang off them, and the
    // story row is what ties them together.
    await attempt("stories", async () => {
        for (;;) {
            const page = await tables.listRows({
                databaseId: db,
                tableId: env.STORIES_TABLE_ID,
                queries: [Query.equal("creatorId", uid), Query.limit(PAGE)],
            });
            if (page.rows.length === 0) break;

            for (const story of page.rows) {
                const chapters = await tables.listRows({
                    databaseId: db,
                    tableId: env.CHAPTERS_TABLE_ID,
                    queries: [
                        Query.equal("storyId", story.$id),
                        Query.limit(PAGE),
                    ],
                });
                for (const chapter of chapters.rows) {
                    await deleteFile(env.STORIES_BUCKET_ID, chapter.$id);
                    await deleteFile(
                        env.STORIES_BUCKET_ID,
                        `audioFor${chapter.$id}`
                    );
                    await attempt(`chapter ${chapter.$id}`, () =>
                        tables.deleteRow({
                            databaseId: db,
                            tableId: env.CHAPTERS_TABLE_ID,
                            rowId: chapter.$id,
                        })
                    );
                }

                await deleteRows(
                    env.LIKES_TABLE_ID,
                    [Query.equal("storyId", story.$id)],
                    `likes on ${story.$id}`
                );
                await deleteFile(env.STORIES_BUCKET_ID, story.$id);
                await tables.deleteRow({
                    databaseId: db,
                    tableId: env.STORIES_TABLE_ID,
                    rowId: story.$id,
                });
            }
            if (page.rows.length < PAGE) break;
        }
    });

    for (const [tableId, column] of OWNED_BY_UID(env)) {
        await attempt(`${column} rows`, () =>
            deleteRows(tableId, [Query.equal(column, uid)], column)
        );
    }

    for (const [tableId, columns] of OWNED_BY_EITHER(env)) {
        for (const column of columns) {
            await attempt(`${column} rows`, () =>
                deleteRows(tableId, [Query.equal(column, uid)], column)
            );
        }
    }

    await attempt("user_stats", () =>
        tables.deleteRow({
            databaseId: db,
            tableId: env.USER_STATS_TABLE_ID,
            rowId: uid,
        })
    );

    if (profile?.profileImageID) {
        await deleteFile(env.USER_IMAGES_BUCKET_ID, profile.profileImageID);
    }

    // The username row is keyed by the username itself, which is what frees
    // the name for somebody else.
    if (profile?.username) {
        await attempt("username", () =>
            tables.deleteRow({
                databaseId: db,
                tableId: env.USERNAMES_TABLE_ID,
                rowId: profile.username,
            })
        );
    }

    await attempt("profile row", () =>
        tables.deleteRow({
            databaseId: db,
            tableId: env.USERS_TABLE_ID,
            rowId: uid,
        })
    );

    // Last, and the one step that has to succeed: while the account exists the
    // user can still sign in, and would find an empty app.
    try {
        await users.delete({ userId: uid });
    } catch (e) {
        error(`account delete failed for ${uid}: ${e.message}`);
        return res.json(
            { msg: "Could not delete the account", failures },
            500
        );
    }

    log(`deleted account ${uid}${failures.length ? ` with ${failures.length} partial failures` : ""}`);
    return res.json({ msg: "Account deleted", failures });
};
