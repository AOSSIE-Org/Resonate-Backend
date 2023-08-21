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
      sdk.Query.limit(25),
    ]
  );
  var secondUserDocId = null;

  console.log(requestDocsRef.documents); // We get all the requests

  //Check if any other request can be matched
  for (let index = 0; index < requestDocsRef.total; index++) {
    try {
      // Create an active pair document (Gives error if a record with same userDocId exists and then we move to the next request)
      var newPairDoc = await db.createDocument(
        databaseId,
        activePairsCollectionId,
        sdk.ID.unique(),
        {
          uid1: newRequestDoc.uid,
          uid2: requestDocsRef.documents[index].uid,
          userDocId1: newRequestDocId,
          userDocId2: requestDocsRef.documents[index].$id,
        }
      );
      console.log(newPairDoc);

      // Delete requests since we have paired them
      await db.deleteDocument(
        databaseId,
        requestsCollectionId,
        requestDocsRef.documents[index].$id
      );
      await db.deleteDocument(
        databaseId,
        requestsCollectionId,
        newRequestDocId
      );
      secondUserDocId = requestDocsRef.documents[index].$id;
      break;
    } catch (e) {
      console.log("That request is already paired: " + e);
    }
  }

  // If there is no second user or new request was paired with another request, end the execution
  if (secondUserDocId == null) {
    res.json({
      message: "Request in queue or was paired already. ",
    });
    return;
    // If the request was paired
  } else {
    res.json({
      message: "Request was paired",
      newPair: newPairDoc,
    });
  }
};
