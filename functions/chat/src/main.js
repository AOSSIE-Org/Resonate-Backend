import { Client, Databases, ID, Query } from "node-appwrite";
import { throwIfMissing } from "./utils.js";

export default async ({ req, res, log, error }) => {
    throwIfMissing(process.env, [
        "APPWRITE_API_KEY",
        "MASTER_DATABASE_ID",
        "MESSAGES_COLLECTION_ID",
        "MUTES_COLLECTION_ID",
        "ROOMS_COLLECTION_ID",
        "PARTICIPANTS_COLLECTION_ID",
    ]);

    const client = new Client()
        .setEndpoint(
            process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);

    try {
        throwIfMissing(JSON.parse(req.body), ["action"]);
    } catch (err) {
        return res.json({ msg: err.message }, 400);
    }

    try {
        const { action, ...params } = JSON.parse(req.body);

        switch (action) {
            case "send": {
                throwIfMissing(params, [
                    "roomId",
                    "creatorId",
                    "creatorUsername",
                    "creatorName",
                    "content",
                ]);
                const {
                    roomId,
                    creatorId,
                    creatorUsername,
                    creatorName,
                    creatorImgUrl = "",
                    content,
                    hasValidTag = false,
                } = params;

                const participantCheck = await db.listDocuments(
                    process.env.MASTER_DATABASE_ID,
                    process.env.PARTICIPANTS_COLLECTION_ID,
                    [
                        Query.equal("roomId", [roomId]),
                        Query.equal("uid", [creatorId]),
                        Query.limit(1),
                    ]
                );
                if (participantCheck.documents.length === 0) {
                    return res.json(
                        {
                            msg: "User is not a participant in this room",
                        },
                        403
                    );
                }

                const muteCheck = await db.listDocuments(
                    process.env.MASTER_DATABASE_ID,
                    process.env.MUTES_COLLECTION_ID,
                    [
                        Query.equal("roomId", [roomId]),
                        Query.equal("uid", [creatorId]),
                        Query.limit(1),
                    ]
                );
                if (muteCheck.documents.length > 0) {
                    return res.json({ msg: "User is muted in this room" }, 403);
                }

                const messageId = params.messageId || ID.unique();
                const now = new Date();
                const message = await db.createDocument(
                    process.env.MASTER_DATABASE_ID,
                    process.env.MESSAGES_COLLECTION_ID,
                    messageId,
                    {
                        roomId,
                        messageId,
                        creatorId,
                        creatorUsername,
                        creatorName,
                        creatorImgUrl,
                        content,
                        hasValidTag,
                        index: now.getTime(),
                        isEdited: false,
                        isDeleted: false,
                        creationDateTime: now.toISOString(),
                    }
                );

                return res.json({ msg: "Message sent", message });
            }

            case "history": {
                throwIfMissing(params, ["roomId"]);
                const { roomId, limit = 100, offset } = params;
                const queries = [
                    Query.equal("roomId", [roomId]),
                    Query.equal("isDeleted", [false]),
                    Query.orderAsc("index"),
                    Query.limit(Math.min(Number(limit), 200)),
                ];
                if (offset) {
                    queries.push(Query.offset(Number(offset)));
                }

                const result = await db.listDocuments(
                    process.env.MASTER_DATABASE_ID,
                    process.env.MESSAGES_COLLECTION_ID,
                    queries
                );

                return res.json({
                    msg: "Success",
                    messages: result.documents,
                    total: result.total,
                });
            }

            case "delete": {
                throwIfMissing(params, ["messageId", "uid"]);
                const { messageId, uid } = params;

                const message = await db.getDocument(
                    process.env.MASTER_DATABASE_ID,
                    process.env.MESSAGES_COLLECTION_ID,
                    messageId
                );

                if (message.creatorId !== uid) {
                    const room = await db.getDocument(
                        process.env.MASTER_DATABASE_ID,
                        process.env.ROOMS_COLLECTION_ID,
                        message.roomId
                    );
                    if (room.adminUid !== uid) {
                        return res.json(
                            { msg: "Not authorized to delete this message" },
                            403
                        );
                    }
                }

                await db.updateDocument(
                    process.env.MASTER_DATABASE_ID,
                    process.env.MESSAGES_COLLECTION_ID,
                    messageId,
                    { isDeleted: true }
                );

                return res.json({ msg: "Message deleted" });
            }

            case "mute": {
                throwIfMissing(params, [
                    "roomId",
                    "targetUid",
                    "moderatorId",
                ]);
                const { roomId, targetUid, moderatorId, isMuted = true } =
                    params;

                const room = await db.getDocument(
                    process.env.MASTER_DATABASE_ID,
                    process.env.ROOMS_COLLECTION_ID,
                    roomId
                );
                if (room.adminUid !== moderatorId) {
                    return res.json(
                        { msg: "Only room admin can mute users" },
                        403
                    );
                }

                if (isMuted) {
                    const existing = await db.listDocuments(
                        process.env.MASTER_DATABASE_ID,
                        process.env.MUTES_COLLECTION_ID,
                        [
                            Query.equal("roomId", [roomId]),
                            Query.equal("uid", [targetUid]),
                            Query.limit(1),
                        ]
                    );
                    if (existing.documents.length === 0) {
                        await db.createDocument(
                            process.env.MASTER_DATABASE_ID,
                            process.env.MUTES_COLLECTION_ID,
                            ID.unique(),
                            { roomId, uid: targetUid, mutedBy: moderatorId }
                        );
                    }
                    return res.json({ msg: "User muted" });
                }

                const toUnmute = await db.listDocuments(
                    process.env.MASTER_DATABASE_ID,
                    process.env.MUTES_COLLECTION_ID,
                    [
                        Query.equal("roomId", [roomId]),
                        Query.equal("uid", [targetUid]),
                    ]
                );
                for (const doc of toUnmute.documents) {
                    await db.deleteDocument(
                        process.env.MASTER_DATABASE_ID,
                        process.env.MUTES_COLLECTION_ID,
                        doc.$id
                    );
                }
                return res.json({ msg: "User unmuted" });
            }

            default:
                return res.json({ msg: `Unknown action: ${action}` }, 400);
        }
    } catch (e) {
        error(String(e));
        return res.json({ msg: "Chat operation failed" }, 500);
    }
};
