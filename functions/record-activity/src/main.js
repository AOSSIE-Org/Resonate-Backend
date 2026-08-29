import { createHash } from "node:crypto";
import { Client, TablesDB, Query } from "node-appwrite";
import { throwIfMissing } from "./utils.js";
import {
    loadBadgeCatalogue,
    evaluateBadges,
    newlyEarned,
    autoShowcase,
    pruneShowcase,
    MAX_PILL_BADGES,
} from "./achievements.js";
import {
    EMPTY_STATS,
    fromRow,
    toRowData,
    utcToday,
    applyDailyActivity,
    applyInteractions,
} from "./stats.js";

// The only writer of user_stats. Actions and responses are documented in README.md.
export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "USER_DATA_DATABASE_ID",
        "USER_STATS_TABLE_ID",
        "THRESHOLDS_TABLE_ID",
        "ROOM_CREDITS_TABLE_ID",
        "MASTER_DATABASE_ID",
        "ROOMS_TABLE_ID",
        "PARTICIPANTS_TABLE_ID",
    ]);

    const tables = new TablesDB(
        new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1")
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY)
    );

    // Whoever Appwrite authenticated; a uid in the body is deliberately ignored.
    const uid = req.headers["x-appwrite-user-id"];
    if (!uid) return res.json({ msg: "Not signed in" }, 401);

    let body;
    try {
        body = req.body ? JSON.parse(req.body) : {};
    } catch (_) {
        return res.json({ msg: "Malformed request body" }, 400);
    }

    const minParticipants = Number(process.env.MIN_ROOM_PARTICIPANTS ?? 6);
    const dailyCap = Number(process.env.DAILY_INTERACTION_CAP ?? 100);
    const action = body.action ?? "activity";
    const extra = {};

    try {
        const before = await readOrCreateStats(tables, uid);
        let stats = before;

        switch (action) {
            case "read":
                break;

            case "activity":
                stats = applyDailyActivity(stats, utcToday());
                stats = applyInteractions(stats, body.interactions ?? 0, dailyCap);
                break;

            case "roomCredit": {
                if (!body.roomId || typeof body.roomId !== "string") {
                    return res.json({ msg: "Missing roomId" }, 400);
                }
                const credit = await creditRoom({
                    tables,
                    uid,
                    roomId: body.roomId,
                    minParticipants,
                    log,
                });
                extra.credited = credit.role !== null;
                if (credit.reason) extra.reason = credit.reason;
                if (credit.role === "host") {
                    stats = { ...stats, roomsHosted: stats.roomsHosted + 1 };
                } else if (credit.role === "moderator") {
                    stats = { ...stats, roomsModerated: stats.roomsModerated + 1 };
                }
                break;
            }

            case "display": {
                const showcase = chooseShowcase(stats, body);
                if (showcase.error) return res.json({ msg: showcase.error }, 400);
                stats = { ...stats, ...showcase.value };
                break;
            }

            default:
                return res.json({ msg: `Unknown action: ${action}` }, 400);
        }

        const catalogue = await loadBadgeCatalogue(tables, { log, error });
        stats = { ...stats, badges: evaluateBadges(stats, catalogue, stats.badges) };
        // Before the prune, so an upgrade swaps the pill rather than losing it.
        stats = { ...stats, ...autoShowcase(stats, before.badges, catalogue) };
        stats = { ...stats, ...pruneShowcase(stats) };

        if (changed(before, stats)) {
            await tables.updateRow({
                databaseId: process.env.USER_DATA_DATABASE_ID,
                tableId: process.env.USER_STATS_TABLE_ID,
                rowId: uid,
                data: toRowData(stats),
            });
        }

        return res.json({
            stats,
            newBadges: newlyEarned(before.badges, stats.badges),
            ...extra,
        });
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Could not record activity" }, 500);
    }
};

// Created on first contact, so no signup hook is needed.
async function readOrCreateStats(tables, uid) {
    try {
        const row = await tables.getRow({
            databaseId: process.env.USER_DATA_DATABASE_ID,
            tableId: process.env.USER_STATS_TABLE_ID,
            rowId: uid,
        });
        return fromRow(row);
    } catch (err) {
        if (err.code !== 404) throw err;
    }

    try {
        const row = await tables.createRow({
            databaseId: process.env.USER_DATA_DATABASE_ID,
            tableId: process.env.USER_STATS_TABLE_ID,
            rowId: uid,
            data: toRowData(EMPTY_STATS),
        });
        return fromRow(row);
    } catch (err) {
        // Two first-ever calls can race; the loser just reads what the winner wrote.
        if (err.code !== 409) throw err;
        const row = await tables.getRow({
            databaseId: process.env.USER_DATA_DATABASE_ID,
            tableId: process.env.USER_STATS_TABLE_ID,
            rowId: uid,
        });
        return fromRow(row);
    }
}

// Re-derives every claim the client makes; a refusal is a reason, not a 4xx.
async function creditRoom({ tables, uid, roomId, minParticipants, log }) {
    let room;
    try {
        room = await tables.getRow({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.ROOMS_TABLE_ID,
            rowId: roomId,
            queries: [Query.select(["$id", "adminUid"])],
        });
    } catch (err) {
        if (err.code === 404) return { role: null, reason: "roomNotFound" };
        throw err;
    }

    const participants = await tables.listRows({
        databaseId: process.env.MASTER_DATABASE_ID,
        tableId: process.env.PARTICIPANTS_TABLE_ID,
        queries: [Query.equal("roomId", [roomId]), Query.limit(1)],
    });
    if (participants.total < minParticipants) {
        log(`Room ${roomId} has ${participants.total} participants, no credit`);
        return { role: null, reason: "tooSmall" };
    }

    let role = null;
    if (room.adminUid === uid) {
        // Separate signals in the spec; crediting both double-counts one room.
        role = "host";
    } else {
        const mine = await tables.listRows({
            databaseId: process.env.MASTER_DATABASE_ID,
            tableId: process.env.PARTICIPANTS_TABLE_ID,
            queries: [
                Query.equal("roomId", [roomId]),
                Query.equal("uid", [uid]),
                Query.equal("isModerator", [true]),
                Query.limit(1),
            ],
        });
        if (mine.total > 0) role = "moderator";
    }

    if (role === null) return { role: null, reason: "notEligible" };

    // Claim the credit before granting it: a concurrent duplicate loses on the id.
    const creditId = createHash("sha256")
        .update(`${roomId}:${uid}:${role}`)
        .digest("hex")
        .slice(0, 32);
    try {
        await tables.createRow({
            databaseId: process.env.USER_DATA_DATABASE_ID,
            tableId: process.env.ROOM_CREDITS_TABLE_ID,
            rowId: creditId,
            data: { roomId, uid, role },
        });
    } catch (err) {
        if (err.code === 409) {
            log(`Room ${roomId} already credited to ${uid} as ${role}`);
            return { role: null, reason: "alreadyCredited" };
        }
        throw err;
    }

    return { role };
}

// Validates a showcase pick against what the user has actually earned.
function chooseShowcase(stats, body) {
    const earned = new Set(stats.badges ?? []);

    const requested = body.displayedBadges ?? stats.displayedBadges ?? [];
    if (!Array.isArray(requested)) return { error: "displayedBadges must be a list" };
    if (requested.length > MAX_PILL_BADGES) {
        return { error: `At most ${MAX_PILL_BADGES} badges can be displayed` };
    }
    if (requested.some((badgeId) => !earned.has(badgeId))) {
        return { error: "Cannot display a badge that has not been earned" };
    }

    const avatarBadge =
        body.avatarBadge === undefined ? (stats.avatarBadge ?? null) : body.avatarBadge;
    if (avatarBadge !== null && !earned.has(avatarBadge)) {
        return { error: "Cannot wear a badge that has not been earned" };
    }

    return { value: { displayedBadges: [...new Set(requested)], avatarBadge } };
}

function changed(before, after) {
    return JSON.stringify(toRowData(before)) !== JSON.stringify(toRowData(after));
}
