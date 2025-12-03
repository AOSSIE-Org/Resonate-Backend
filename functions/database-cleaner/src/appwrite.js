const { Client, Databases, Query } = require("node-appwrite");
const { getExpiryDate } = require("./utils.js");

class AppwriteService {
  constructor() {
    const client = new Client();
    client
      .setEndpoint(
        process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    this.databases = new Databases(client);
  }

  async doesRoomExist(roomId) {
    try {
      await this.databases.getDocument(
        process.env.MASTER_DATABASE_ID,
        process.env.ROOMS_COLLECTION_ID,
        roomId
      );
      return true;
    } catch (err) {
      if (err.code !== 404) throw err;
      return false;
    }
  }

  async cleanParticipantsCollection() {
    let cursor = null;

    while (true) {
      const queries = [Query.limit(25)];
      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      const participantDocs = await this.databases.listDocuments(
        process.env.MASTER_DATABASE_ID,
        process.env.PARTICIPANTS_COLLECTION_ID,
        queries
      );

      if (participantDocs.documents.length === 0) {
        break;
      }

      await Promise.all(
        participantDocs.documents.map(async (participantDoc) => {
          const exists = await this.doesRoomExist(participantDoc.roomId);
          if (!exists) {
            await this.databases.deleteDocument(
              process.env.MASTER_DATABASE_ID,
              process.env.PARTICIPANTS_COLLECTION_ID,
              participantDoc.$id
            );
          }
        })
      );

      cursor =
        participantDocs.documents[participantDocs.documents.length - 1].$id;
    }
  }

  async clearOldOTPs() {
    let cursor = null;
    const currentDate = new Date().toDateString();

    while (true) {
      const queries = [Query.notEqual("date", currentDate), Query.limit(100)];
      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      const oneDayOldOTPs = await this.databases.listDocuments(
        process.env.VERIFICATION_DATABASE_ID,
        process.env.OTP_COLLECTION_ID,
        queries
      );

      if (oneDayOldOTPs.documents.length === 0) {
        break;
      }

      await Promise.all(
        oneDayOldOTPs.documents.map(async (otp) => {
          await this.databases.deleteDocument(
            process.env.VERIFICATION_DATABASE_ID,
            process.env.OTP_COLLECTION_ID,
            otp.$id
          );
        })
      );

      cursor = oneDayOldOTPs.documents[oneDayOldOTPs.documents.length - 1].$id;
    }
  }
}

module.exports = AppwriteService;
