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

  let databaseId = req.variables["databaseId"];
  let requestsCollectionId = req.variables["requestsCollectionId"];
  let activePairsCollectionId = req.variables["activePairsCollectionId"];
  var documents = await db.listDocuments(databaseId, requestsCollectionId);

  console.log(documents); // We get all the requests

  res.json({
    isResonateAwesome: true,
    variables: req.variables,
    event: req.variables["APPWRITE_FUNCTION_EVENT"],
  });
};
