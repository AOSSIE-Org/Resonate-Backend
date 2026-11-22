import assert from "node:assert/strict";
import test from "node:test";
import { TablesDB } from "node-appwrite";
import chat from "../src/main.js";

Object.assign(process.env, {
    APPWRITE_FUNCTION_PROJECT_ID: "test-project",
    MASTER_DATABASE_ID: "test-db",
    ROOMS_TABLE_ID: "rooms",
    PARTICIPANTS_TABLE_ID: "participants",
    MESSAGES_TABLE_ID: "messages",
    MUTES_TABLE_ID: "mutes",
    USERS_TABLE_ID: "users",
});

const member = "member-1";
const admin = "admin-1";
const roomId = "room-1";

function execute(body, uid = member) {
    return chat({
        req: {
            bodyText: JSON.stringify(body),
            headers: {
                "x-appwrite-key": "stub-key",
                "x-appwrite-user-id": uid,
            },
        },
        res: { json: (data, code = 200) => ({ data, code }) },
        error() {},
    });
}

function appwriteError(code, type) {
    return Object.assign(new Error(type), { code, type });
}

test("requires an authenticated session before checking room membership", async (t) => {
    const listRows = t.mock.method(
        TablesDB.prototype,
        "listRows",
        async () => {},
    );
    assert.equal((await execute({ action: "history", roomId }, "")).code, 401);
    assert.equal(listRows.mock.callCount(), 0);
});

test("history requires a participant row for the current user and room", async (t) => {
    const listRows = t.mock.method(
        TablesDB.prototype,
        "listRows",
        async ({ tableId, queries }) => {
            assert.equal(tableId, "participants");
            const equal = queries
                .map(JSON.parse)
                .filter(({ method }) => method === "equal");
            assert.deepEqual(
                equal.map(({ attribute, values }) => [attribute, values[0]]),
                [
                    ["uid", member],
                    ["roomId", roomId],
                ],
            );
            return { rows: [] };
        },
    );
    const { code } = await execute({ action: "history", roomId });
    assert.equal(code, 403);
    assert.equal(listRows.mock.callCount(), 1);
});

test("history breaks equal-index ties and rejects invalid pages before reading messages", async (t) => {
    const message = { $id: "message-1", index: 12 };
    const listRows = t.mock.method(
        TablesDB.prototype,
        "listRows",
        async ({ tableId, queries }) => {
            if (tableId === "participants") return { rows: [{ uid: member }] };
            assert.equal(tableId, "messages");
            const parsed = queries.map(JSON.parse);
            assert.deepEqual(
                parsed
                    .filter(({ method }) => method === "orderAsc")
                    .map(({ attribute }) => attribute),
                ["index", "$sequence"],
            );
            assert.equal(
                parsed.find(({ method }) => method === "offset").values[0],
                2,
            );
            assert.ok(
                parsed.some(
                    ({ attribute, values }) =>
                        attribute === "isDeleted" && values[0] === false,
                ),
            );
            return { rows: [message], total: 3 };
        },
    );

    assert.equal(
        (await execute({ action: "history", roomId, limit: 201 })).code,
        400,
    );
    assert.equal(listRows.mock.callCount(), 1);
    assert.deepEqual(
        await execute({ action: "history", roomId, limit: 1, offset: 2 }),
        {
            code: 200,
            data: { msg: "Success", messages: [message], total: 3 },
        },
    );
});

test("sending uses the caller's profile and the existing table's index range", async (t) => {
    t.mock.method(TablesDB.prototype, "listRows", async ({ tableId }) => ({
        rows:
            tableId === "participants" ? [{ uid: member }] : [{ index: 1000 }],
    }));
    t.mock.method(TablesDB.prototype, "getRow", async ({ tableId, rowId }) => {
        if (tableId === "mutes") throw appwriteError(404, "row_not_found");
        assert.equal(tableId, "users");
        assert.equal(rowId, member);
        return { username: "alex", name: "Alex" };
    });
    t.mock.method(
        TablesDB.prototype,
        "createRow",
        async ({ tableId, rowId, data }) => {
            assert.equal(tableId, "messages");
            assert.equal(rowId, "message-1");
            return { $id: rowId, ...data };
        },
    );

    const { code, data } = await execute({
        action: "send",
        roomId,
        messageId: "message-1",
        content: "Hello",
    });
    assert.equal(code, 200);
    assert.equal(data.message.creatorId, member);
    assert.equal(data.message.creatorUsername, "alex");
    assert.equal(data.message.index, 1000);
});

test("mute uses one row per room/user and unmute removes that same row", async (t) => {
    t.mock.method(TablesDB.prototype, "getRow", async () => ({
        adminUid: admin,
    }));
    const active = new Map();
    t.mock.method(
        TablesDB.prototype,
        "createRow",
        async ({ tableId, rowId, data }) => {
            assert.equal(tableId, "mutes");
            assert.equal(data.mutedBy, admin);
            if (active.has(rowId))
                throw appwriteError(409, "row_already_exists");
            active.set(rowId, data);
        },
    );
    const deleteRow = t.mock.method(
        TablesDB.prototype,
        "deleteRow",
        async ({ rowId }) => {
            assert.ok(active.delete(rowId));
        },
    );

    const payload = { action: "mute", roomId, targetUid: member };
    assert.equal((await execute(payload)).code, 403);
    assert.equal((await execute(payload, admin)).code, 200);
    assert.equal((await execute(payload, admin)).code, 200);
    assert.equal(active.size, 1);
    assert.equal(
        (await execute({ ...payload, isMuted: false }, admin)).code,
        200,
    );
    assert.equal(deleteRow.mock.callCount(), 1);
    assert.equal(active.size, 0);
});

test("the message creator can soft-delete their message", async (t) => {
    t.mock.method(TablesDB.prototype, "getRow", async () => ({
        creatorId: member,
        roomId,
    }));
    const updateRow = t.mock.method(
        TablesDB.prototype,
        "updateRow",
        async () => {},
    );
    const { code } = await execute({
        action: "delete",
        messageId: "message-1",
    });

    assert.equal(code, 200);
    assert.deepEqual(updateRow.mock.calls[0].arguments[0].data, {
        isDeleted: true,
    });
});

test("a missing action returns the documented 400 without accessing tables", async (t) => {
    const listRows = t.mock.method(
        TablesDB.prototype,
        "listRows",
        async () => {},
    );
    assert.deepEqual(await execute({ roomId }), {
        code: 400,
        data: { msg: "Missing required fields: action" },
    });
    assert.equal(listRows.mock.callCount(), 0);
});
