import { timingSafeEqual } from "node:crypto";
import { Client, TablesDB } from "node-appwrite";
import { throwIfMissing } from "./utils.js";

const OTP_TTL_MS = 5 * 60 * 1000;

export default async ({ req, res, error }) => {
  const fail = (message, status) =>
    res.json({ success: false, message }, status);

  let body;
  try {
    body = JSON.parse(req.bodyText ?? req.body);
  } catch {
    return fail("Malformed request body", 400);
  }
  const { otpID, userOTP, verify_ID: verificationId } = body ?? {};
  if (
    ![otpID, userOTP, verificationId].every(
      (value) => typeof value === "string" && value.trim() !== "",
    )
  ) {
    return fail("otpID, userOTP, and verify_ID are required", 400);
  }

  try {
    throwIfMissing(process.env, [
      "APPWRITE_FUNCTION_PROJECT_ID",
      "VERIFICATION_DATABASE_ID",
      "OTP_TABLE_ID",
      "VERIFY_TABLE_ID",
    ]);
    const client = new Client()
      .setEndpoint(
        process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1",
      )
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers["x-appwrite-key"]);
    const db = new TablesDB(client);
    const databaseId = process.env.VERIFICATION_DATABASE_ID;
    const otpParams = {
      databaseId,
      tableId: process.env.OTP_TABLE_ID,
      rowId: otpID,
    };

    let otpRow;
    try {
      otpRow = await db.getRow(otpParams);
    } catch (err) {
      if (err.code === 404) return fail("OTP not found or already used", 401);
      throw err;
    }

    // Use Appwrite's creation timestamp so verification needs no new column.
    const createdAt = Date.parse(otpRow.$createdAt);
    const now = Date.now();
    const expired =
      !Number.isFinite(createdAt) ||
      now < createdAt ||
      now - createdAt >= OTP_TTL_MS;

    // Consume the row before creating a verification record. Only a request
    // whose delete succeeds can record a result, including incorrect codes.
    try {
      await db.deleteRow(otpParams);
    } catch (err) {
      if (err.code === 404) return fail("OTP not found or already used", 401);
      throw err;
    }
    if (expired) return fail("OTP has expired", 401);

    const expected = Buffer.from(
      typeof otpRow.otp === "string" ? otpRow.otp : "",
    );
    const entered = Buffer.from(userOTP);
    const valid =
      expected.length === entered.length && timingSafeEqual(expected, entered);

    await db.createRow({
      databaseId,
      tableId: process.env.VERIFY_TABLE_ID,
      rowId: verificationId,
      data: { status: String(valid) },
    });

    return valid
      ? res.json({ success: true, message: "OTP verified successfully" }, 200)
      : fail("Invalid OTP", 401);
  } catch (err) {
    error(`OTP verification failed: ${err.type ?? err.name}`);
    return fail("OTP verification failed", 500);
  }
};
