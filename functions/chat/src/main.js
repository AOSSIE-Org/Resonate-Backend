import { createHash } from "node:crypto";
import { Client, ID, Query, TablesDB } from "node-appwrite";
import { throwIfMissing } from "./utils.js";

const MAX_PAGE_SIZE = 200;
const MAX_MESSAGE_INDEX = 1000;

class InvalidInput extends Error {}

function requireStrings(body, ...fields) {
    const missing = fields.filter(
        (key) => typeof body[key] !== "string" || !body[key].trim(),
    );
    if (missing.length) {
        throw new InvalidInput(
            `Missing required fields: ${missing.join(", ")}`,
        );
    }
}

function muteRowId(roomId, uid) {
    return createHash("sha256")
        .update(JSON.stringify([roomId, uid]))
        .digest("hex")
        .slice(0, 36);
}

function isMissingRow(err) {
    return err.code === 404 && (!err.type || err.type === "row_not_found");
}

export default async ({ req, res, error }) => {
    let body;
    try {
        body = JSON.parse(req.bodyText ?? req.body);
    } catch {
        return res.json({ msg: "Malformed request body" }, 400);
    }
    if (typeof body?.action !== "string" || !body.action.trim()) {
        return res.json({ msg: "Missing required fields: action" }, 400);
    }

    // Appwrite supplies this identity for authenticated function executions.
    const actorId = req.headers["x-appwrite-user-id"];
    if (!actorId) return res.json({ msg: "Sign in to use room chat" }, 401);

    try {
        const env = process.env;
        throwIfMissing(env, [
            "APPWRITE_FUNCTION_PROJECT_ID",
            "MASTER_DATABASE_ID",
            "ROOMS_TABLE_ID",
            "PARTICIPANTS_TABLE_ID",
            "MESSAGES_TABLE_ID",
            "MUTES_TABLE_ID",
            "USERS_TABLE_ID",
        ]);
        const client = new Client()
            .setEndpoint(
                env.APPWRITE_ENDPOINT ??
                    env.APPWRITE_FUNCTION_API_ENDPOINT ??
                    "https://cloud.appwrite.io/v1",
            )
            .setProject(env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(req.headers["x-appwrite-key"]);
        const db = new TablesDB(client);
        const databaseId = env.MASTER_DATABASE_ID;

        async function optionalRow(tableId, rowId) {
            try {
                return await db.getRow({ databaseId, tableId, rowId });
            } catch (err) {
                if (isMissingRow(err)) return null;
                throw err;
            }
        }

        async function isParticipant(roomId) {
            const { rows } = await db.listRows({
                databaseId,
                tableId: env.PARTICIPANTS_TABLE_ID,
                queries: [
                    Query.equal("uid", [actorId]),
                    Query.equal("roomId", [roomId]),
                    Query.limit(1),
                ],
            });
            return rows.length > 0;
        }

        async function isMuted(roomId) {
            return (
                (await optionalRow(
                    env.MUTES_TABLE_ID,
                    muteRowId(roomId, actorId),
                )) !== null
            );
        }

        const { action, roomId } = body;
        if (
            action === "send" ||
            action === "history" ||
            action === "checkMute"
        ) {
            requireStrings(body, "roomId");
            if (!(await isParticipant(roomId))) {
                return res.json(
                    { msg: "User is not a participant in this room" },
                    403,
                );
            }
        }

        switch (action) {
            case "send": {
                requireStrings(body, "content");
                if (body.content.length > 1000) {
                    throw new InvalidInput(
                        "Message content must fit within 1000 characters",
                    );
                }
                if (await isMuted(roomId)) {
                    return res.json({ msg: "User is muted in this room" }, 403);
                }
                const rowId = body.messageId ?? ID.unique();
                if (
                    typeof rowId !== "string" ||
                    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(rowId)
                ) {
                    throw new InvalidInput("Invalid messageId");
                }
                const profile = await optionalRow(env.USERS_TABLE_ID, actorId);
                if (!profile)
                    return res.json({ msg: "User profile not found" }, 404);

                const previous = await db.listRows({
                    databaseId,
                    tableId: env.MESSAGES_TABLE_ID,
                    queries: [
                        Query.equal("roomId", [roomId]),
                        Query.orderDesc("index"),
                        Query.limit(1),
                    ],
                });
                // `index` is a bounded integer in the existing messages table.
                const nextIndex = Math.min(
                    (previous.rows[0]?.index ?? -1) + 1,
                    MAX_MESSAGE_INDEX,
                );
                const message = await db.createRow({
                    databaseId,
                    tableId: env.MESSAGES_TABLE_ID,
                    rowId,
                    data: {
                        roomId,
                        messageId: rowId,
                        creatorId: actorId,
                        creatorUsername: profile.username.slice(0, 20),
                        creatorName: profile.name.slice(0, 20),
                        ...(profile.profileImageUrl
                            ? { creatorImgUrl: profile.profileImageUrl }
                            : {}),
                        content: body.content,
                        hasValidTag: false,
                        index: nextIndex,
                        isEdited: false,
                        isDeleted: false,
                        creationDateTime: new Date().toISOString(),
                    },
                });
                return res.json({ msg: "Message sent", message });
            }
            case "history": {
                const { limit = 100, offset = 0 } = body;
                if (
                    !Number.isSafeInteger(limit) ||
                    limit < 1 ||
                    limit > MAX_PAGE_SIZE ||
                    !Number.isSafeInteger(offset) ||
                    offset < 0
                ) {
                    throw new InvalidInput(
                        "limit must be an integer from 1 to 200 and offset a non-negative integer",
                    );
                }
                const result = await db.listRows({
                    databaseId,
                    tableId: env.MESSAGES_TABLE_ID,
                    queries: [
                        Query.equal("roomId", [roomId]),
                        Query.equal("isDeleted", [false]),
                        Query.orderAsc("index"),
                        Query.orderAsc("$sequence"),
                        Query.limit(limit),
                        ...(offset ? [Query.offset(offset)] : []),
                    ],
                });
                return res.json({
                    msg: "Success",
                    messages: result.rows,
                    total: result.total,
                });
            }
            case "delete": {
                requireStrings(body, "messageId");
                const message = await optionalRow(
                    env.MESSAGES_TABLE_ID,
                    body.messageId,
                );
                if (!message)
                    return res.json({ msg: "Message not found" }, 404);
                if (message.creatorId !== actorId) {
                    const room = await optionalRow(
                        env.ROOMS_TABLE_ID,
                        message.roomId,
                    );
                    if (room?.adminUid !== actorId) {
                        return res.json(
                            { msg: "Not authorized to delete this message" },
                            403,
                        );
                    }
                }
                await db.updateRow({
                    databaseId,
                    tableId: env.MESSAGES_TABLE_ID,
                    rowId: body.messageId,
                    data: { isDeleted: true },
                });
                return res.json({ msg: "Message deleted" });
            }
            case "checkMute":
                return res.json({
                    msg: "Success",
                    isMuted: await isMuted(roomId),
                });
            case "mute": {
                requireStrings(body, "roomId", "targetUid");
                const { targetUid, isMuted: shouldMute = true } = body;
                if (typeof shouldMute !== "boolean")
                    throw new InvalidInput("isMuted must be a boolean");
                const room = await optionalRow(env.ROOMS_TABLE_ID, roomId);
                if (room?.adminUid !== actorId) {
                    return res.json(
                        { msg: "Only room admin can mute users" },
                        403,
                    );
                }

                const row = {
                    databaseId,
                    tableId: env.MUTES_TABLE_ID,
                    rowId: muteRowId(roomId, targetUid),
                };
                if (shouldMute) {
                    try {
                        await db.createRow({
                            ...row,
                            data: { roomId, uid: targetUid, mutedBy: actorId },
                        });
                    } catch (err) {
                        if (
                            err.code !== 409 ||
                            (err.type && err.type !== "row_already_exists")
                        )
                            throw err;
                    }
                    return res.json({ msg: "User muted" });
                }
                try {
                    await db.deleteRow(row);
                } catch (err) {
                    if (!isMissingRow(err)) throw err;
                }
                return res.json({ msg: "User unmuted" });
            }
            default:
                return res.json({ msg: "Unknown action" }, 400);
        }
    } catch (err) {
        if (err instanceof InvalidInput)
            return res.json({ msg: err.message }, 400);
        error(`Chat operation failed: ${err.type ?? err.name}`);
        return res.json({ msg: "Chat operation failed" }, 500);
    }
};
