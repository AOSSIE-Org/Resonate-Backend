import { Client, TablesDB } from "node-appwrite";
import { generateToken } from "./livekit.js";
import { throwIfMissing } from "./utils.js";

async function isJoinable(tables, env, roomId, uid) {
  // The app passes the backing row ID as the LiveKit name, including for
  // pair chats and calls whose LiveKit room starts on the first connection.
  const registries = [
    [env.ROOMS_TABLE_ID, () => true],
    [env.LIVE_CHAPTERS_TABLE_ID, () => true],
    [env.ACTIVE_PAIRS_TABLE_ID, (row) => row.uid1 === uid || row.uid2 === uid],
    [
      env.FRIENDS_TABLE_ID,
      (row) =>
        row.requestStatus === "accepted" &&
        (row.senderId === uid || row.recieverId === uid),
    ],
  ];
  for (const [tableId, allowed] of registries) {
    try {
      const row = await tables.getRow({
        databaseId: env.MASTER_DATABASE_ID,
        tableId,
        rowId: roomId,
      });
      return allowed(row);
    } catch (err) {
      if (err.code !== 404 || (err.type && err.type !== "row_not_found"))
        throw err;
    }
  }
  return false;
}

export default async ({ req, res, error }) => {
  let body;
  try {
    body = JSON.parse(req.bodyText ?? req.body);
  } catch {
    return res.json({ msg: "Malformed request body" }, 400);
  }
  const { roomName, uid: userId } = body ?? {};
  if (
    typeof roomName !== "string" ||
    !roomName.trim() ||
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return res.json({ msg: "roomName and uid are required" }, 400);
  }
  const uid = req.headers["x-appwrite-user-id"];
  if (!uid) return res.json({ msg: "Sign in to join a room" }, 401);
  if (uid !== userId)
    return res.json({ msg: "Cannot join as another user" }, 403);

  try {
    throwIfMissing(process.env, [
      "APPWRITE_FUNCTION_PROJECT_ID",
      "MASTER_DATABASE_ID",
      "ROOMS_TABLE_ID",
      "LIVE_CHAPTERS_TABLE_ID",
      "ACTIVE_PAIRS_TABLE_ID",
      "FRIENDS_TABLE_ID",
      "LIVEKIT_API_KEY",
      "LIVEKIT_API_SECRET",
      "LIVEKIT_SOCKET_URL",
    ]);
    const tables = new TablesDB(
      new Client()
        .setEndpoint(
          process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1",
        )
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(req.headers["x-appwrite-key"]),
    );

    if (!(await isJoinable(tables, process.env, roomName, uid))) {
      return res.json({ msg: "Room not found" }, 404);
    }

    const accessToken = await generateToken(process.env, roomName, uid, false);

    return res.json({
      msg: "Success",
      livekit_socket_url: `${process.env.LIVEKIT_SOCKET_URL}`,
      access_token: accessToken,
    });
  } catch (err) {
    error(`Room lookup or token generation failed: ${err.type ?? err.name}`);
    return res.json({ msg: "Error joining room" }, 500);
  }
};
