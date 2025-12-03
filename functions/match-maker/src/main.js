const { Client, Databases, ID, Query } = require("node-appwrite");
const { throwIfMissing } = require("./utils.js");

module.exports = async ({ req, res, log, error }) => {
  throwIfMissing(process.env, [
    "APPWRITE_API_KEY",
    "DATABASE_ID",
    "REQUESTS_COLLECTION_ID",
    "ACTIVE_PAIRS_COLLECTION_ID",
  ]);

  const client = new Client()
    .setEndpoint(
      process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
    )
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);

  log(req.headers);
  const triggerEvent = req.headers["x-appwrite-event"];
  const parts = triggerEvent.split(".");
  const newRequestDocId = parts[parts.length - 1];
  log(newRequestDocId);

  const newRequestDoc = await db.getDocument(
    process.env.DATABASE_ID,
    process.env.REQUESTS_COLLECTION_ID,
    newRequestDocId
  );

  if (!newRequestDoc.isRandom) {
    return res.json({
      message: "Request is not Random",
    });
  }

  const requestDocsRef = await db.listDocuments(
    process.env.DATABASE_ID,
    process.env.REQUESTS_COLLECTION_ID,
    [
      Query.notEqual("$id", [newRequestDocId]),
      Query.equal("languageIso", [newRequestDoc.languageIso]),
      Query.equal("isAnonymous", [newRequestDoc.isAnonymous]),
      Query.equal("isRandom", [true]),
      Query.orderAsc("$createdAt"),
      Query.limit(25),
    ]
  );

  log(requestDocsRef.documents);

  for (let index = 0; index < requestDocsRef.documents.length; index++) {
    let newPairDoc;
    try {
      newPairDoc = await db.createDocument(
        process.env.DATABASE_ID,
        process.env.ACTIVE_PAIRS_COLLECTION_ID,
        ID.unique(),
        {
          uid1: newRequestDoc.uid,
          uid2: requestDocsRef.documents[index].uid,
          userDocId1: newRequestDocId,
          userDocId2: requestDocsRef.documents[index].$id,
          ...(newRequestDoc.isAnonymous
            ? {}
            : {
                userName1: newRequestDoc.userName,
                userName2: requestDocsRef.documents[index].userName,
              }),
        }
      );
    } catch (e) {
      error("Failed to create pair, trying next candidate: ");
      error(String(e));
      continue;
    }

    log(newPairDoc);

    try {
      await db.deleteDocument(
        process.env.DATABASE_ID,
        process.env.REQUESTS_COLLECTION_ID,
        requestDocsRef.documents[index].$id
      );
      await db.deleteDocument(
        process.env.DATABASE_ID,
        process.env.REQUESTS_COLLECTION_ID,
        newRequestDocId
      );
    } catch (e) {
      error("Pair created but cleanup failed (requests may be orphaned): ");
      error(String(e));
    }

    return res.json({
      message: "Request was paired",
      newPair: newPairDoc,
    });
  }

  return res.json({
    message: "Request in queue or was paired already.",
  });
};
