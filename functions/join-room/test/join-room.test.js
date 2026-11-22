import assert from "node:assert/strict";
import test from "node:test";
import { TablesDB } from "node-appwrite";
import joinRoom from "../src/main.js";

Object.assign(process.env, {
  APPWRITE_FUNCTION_PROJECT_ID: "test-project",
  MASTER_DATABASE_ID: "test-database",
  ROOMS_TABLE_ID: "rooms",
  LIVE_CHAPTERS_TABLE_ID: "chapters",
  ACTIVE_PAIRS_TABLE_ID: "pairs",
  FRIENDS_TABLE_ID: "friends",
  LIVEKIT_API_KEY: "test-livekit",
  LIVEKIT_API_SECRET: "test-only-livekit-signing-secret",
  LIVEKIT_SOCKET_URL: "ws://localhost:7880",
});

const uid = "member-1";
const roomName = "registered-room";

function execute() {
  return joinRoom({
    req: {
      bodyText: JSON.stringify({ roomName, uid }),
      headers: { "x-appwrite-key": "stub-key", "x-appwrite-user-id": uid },
    },
    res: { json: (body, status = 200) => ({ body, status }) },
    error() {},
  });
}

function lookup(t, rows) {
  return t.mock.method(
    TablesDB.prototype,
    "getRow",
    async ({ databaseId, tableId, rowId }) => {
      assert.equal(databaseId, "test-database");
      assert.equal(rowId, roomName);
      if (rows[tableId]) return rows[tableId];
      throw Object.assign(new Error("No row"), {
        code: 404,
        type: "row_not_found",
      });
    },
  );
}

for (const [table, row] of [
  ["rooms", { name: "Human-readable title" }],
  ["chapters", {}],
  ["pairs", { uid1: uid, uid2: "member-2" }],
  [
    "friends",
    { senderId: "member-2", recieverId: uid, requestStatus: "accepted" },
  ],
]) {
  test(`joins a registered ${table} room using the row ID`, async (t) => {
    lookup(t, { [table]: row });
    const { body, status } = await execute();

    assert.equal(status, 200);
    assert.equal(typeof body.access_token, "string");
    assert.equal(body.livekit_socket_url, "ws://localhost:7880");
  });
}

test("a missing room returns 404 without a token", async (t) => {
  lookup(t, {});
  assert.deepEqual(await execute(), {
    status: 404,
    body: { msg: "Room not found" },
  });
});

test("an unaccepted friendship is not a registered call room", async (t) => {
  lookup(t, {
    friends: { senderId: "member-2", recieverId: uid, requestStatus: "sent" },
  });
  assert.equal((await execute()).status, 404);
});

test("a table configuration error remains a 500 instead of a missing-room response", async (t) => {
  t.mock.method(TablesDB.prototype, "getRow", async () => {
    throw Object.assign(new Error("Missing table"), {
      code: 404,
      type: "table_not_found",
    });
  });
  assert.equal((await execute()).status, 500);
});
