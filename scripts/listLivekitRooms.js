import { RoomServiceClient } from "livekit-server-sdk";
import express from "express";
import bodyParser from "body-parser";
import { Appwrite } from "appwrite";
import dotenv from "dotenv";
dotenv.config();

const svc = new RoomServiceClient(
  `${process.env.LIVEKIT_HOST}`,
  `${process.env.LIVEKIT_API_KEY}`,
  `${process.env.LIVEKIT_API_SECRET}`
);

const Appwrite = require("appwrite");

const appwrite = new Appwrite();
appwrite.setEndpoint(process.env.APPWRITE_ENDPOINT); 
appwrite.setProject(process.env.APPWRITE_PROJECT_ID);
appwrite.setKey(process.env.APPWRITE_SECRET_API_KEY);

const app = express();
app.use(bodyParser.json());

const activeRooms = {};

app.post ("/livekit-webhook",(req,res) => {
  const event = req.body;

  if(event.type === "participantDisconnected") {
    const roomId = event.room_id;
    const participantId = event.participant_identity;

    if(activeRooms[roomId] {
      activeRooms[roomId] = activeRooms[roomId].filter(id => !==participantId);

      if (activeRooms[roomId.length === 0) {

        app.post("/livekit-webhook", async (req, res) => {
  const event = req.body;

  if (event.type === "participantDisconnected") {
    const roomId = event.room_id;
    const participantId = event.participant_identity;

    if (activeRooms[roomId]) {
      activeRooms[roomId] = activeRooms[roomId].filter(id => id !== participantId);

      if (activeRooms[roomId].length === 0) {
        try {
          // Delete room from Appwrite collection
          const documentIdToDelete =  appwriteRoomDocId; 
          const response = await appwrite.database.deleteDocument(process.env.APPWRITE_COLLECTION_ID, documentIdToDelete);
          console.log(`Deleted room with ID ${documentIdToDelete}`);
        } catch (error) {
          console.error("Error deleting room:", error);
        }
      }
    }
  }

  res.sendStatus(200);
});
        
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Webhook server is listening on port ${port}`);
});
        
svc.listRooms().then((rooms) => {
  console.log("Active LiveKit Rooms\n", rooms);
});
