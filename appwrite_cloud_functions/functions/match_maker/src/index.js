const sdk = require("node-appwrite");

module.exports = async function (req, res) {
  const client = new sdk.Client();
  const db = new sdk.Databases(client);

  if (
    !req.variables["APPWRITE_FUNCTION_ENDPOINT"] ||
    !req.variables["APPWRITE_FUNCTION_API_KEY"]
  ) {
    console.warn(
      "Environment variables are not set. Function cannot use Appwrite SDK."
    );
  } else {
    client
      .setEndpoint(req.variables["APPWRITE_FUNCTION_ENDPOINT"])
      .setProject(req.variables["APPWRITE_FUNCTION_PROJECT_ID"])
      .setKey(req.variables["APPWRITE_FUNCTION_API_KEY"])
      .setSelfSigned(true);
  }

  var newRequestDoc = JSON.parse(req.variables["APPWRITE_FUNCTION_EVENT_DATA"]);
  var newRequestDocId = newRequestDoc.$id;
  console.log(newRequestDocId);

  let databaseId = req.variables["databaseId"];
  let requestsCollectionId = req.variables["requestsCollectionId"];
  let activePairsCollectionId = req.variables["activePairsCollectionId"];
  var requestDocsRef = await db.listDocuments(
    databaseId,
    requestsCollectionId,
    [
      sdk.Query.notEqual("$id", [newRequestDocId]),
      sdk.Query.equal("languageIso", [newRequestDoc.languageIso]),
      sdk.Query.orderAsc("$createdAt"),
    ]
  );
  var secondUserDocId = null;

  console.log(requestDocsRef); // We get all the requests

  // Check if any other request can be matched
  // requestDocsRef.documents.every(async (requestDoc) => {
  //   if (
  //     requestDoc.$id != newRequestDocId &&
  //     requestDoc.languageIso == newRequestDoc.languageIso
  //   ) {
  //     console.log("This is the second user doc id: " + requestDoc.$id);
  //     secondUserDocId = requestDoc.$id;

  //     // Delete requests since we will pair them
  //     await db.deleteDocument(databaseId, requestsCollectionId, requestDoc.$id);
  //     await db.deleteDocument(
  //       databaseId,
  //       requestsCollectionId,
  //       newRequestDocId
  //     );
  //     return false;
  //   }
  //   return true;
  // });

  // If there is no second user, end the execution
  if (secondUserDocId == null) {
    res.json({
      message: "Request in queue",
    });
    return;
  }

  // To create an active pair document
  var newPairDoc = await db.createDocument(
    databaseId,
    activePairsCollectionId,
    sdk.ID.unique(),
    {
      userDocId1: newRequestDocId,
      userDocId2: secondUserDocId,
    }
  );
  console.log(newPairDoc);

  res.json({
    message: "Request was paired",
    newPair: newPairDoc,
    variables: req.variables,
    newRequest: newRequestDocId,
  });
};
