import assert from "node:assert/strict";
import test from "node:test";
import { TablesDB } from "node-appwrite";
import verify from "../src/main.js";

process.env.APPWRITE_FUNCTION_PROJECT_ID = "test-project";
process.env.VERIFICATION_DATABASE_ID = "test-database";
process.env.OTP_TABLE_ID = "otp";
process.env.VERIFY_TABLE_ID = "verification";

const payload = { otpID: "otp-row", userOTP: "123456", verify_ID: "check-row" };

function execute(body = JSON.stringify(payload)) {
  return verify({
    req: { body, headers: { "x-appwrite-key": "stub-key" } },
    res: { json: (data, code) => ({ data, code }) },
    error() {},
  });
}

function store(t, { createdAt = new Date().toISOString(), consumeError } = {}) {
  const steps = [];
  t.mock.method(TablesDB.prototype, "getRow", async () => ({
    otp: payload.userOTP,
    $createdAt: createdAt,
  }));
  t.mock.method(TablesDB.prototype, "deleteRow", async () => {
    steps.push("delete");
    if (consumeError) throw consumeError;
  });
  t.mock.method(
    TablesDB.prototype,
    "createRow",
    async ({ tableId, rowId, data }) => {
      steps.push({ tableId, rowId, ...data });
    },
  );
  return steps;
}

test("verified codes are consumed before writing the Flutter-compatible status", async (t) => {
  const steps = store(t);
  const response = await execute();

  assert.equal(response.code, 200);
  assert.equal(response.data.success, true);
  assert.deepEqual(steps, [
    "delete",
    { tableId: "verification", rowId: "check-row", status: "true" },
  ]);
});

test("expired codes are cleaned up without recording a verification", async (t) => {
  const steps = store(t, {
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  });
  const response = await execute();

  assert.equal(response.code, 401);
  assert.equal(response.data.message, "OTP has expired");
  assert.deepEqual(steps, ["delete"]);
});

test("incorrect codes record a failure and are consumed", async (t) => {
  const steps = store(t);
  const response = await execute(
    JSON.stringify({ ...payload, userOTP: "654321" }),
  );

  assert.equal(response.code, 401);
  assert.deepEqual(steps, [
    "delete",
    { tableId: "verification", rowId: "check-row", status: "false" },
  ]);
});

test("a failed consume does not write a success record", async (t) => {
  const steps = store(t, {
    consumeError: Object.assign(new Error("already consumed"), { code: 404 }),
  });
  const response = await execute();

  assert.equal(response.code, 401);
  assert.deepEqual(steps, ["delete"]);
});

test("malformed and incomplete requests return 400 before accessing the store", async (t) => {
  const getRow = t.mock.method(TablesDB.prototype, "getRow", async () => {});

  for (const body of ["{", "{}", "null"]) {
    assert.equal((await execute(body)).code, 400);
  }
  assert.equal(getRow.mock.callCount(), 0);
});
