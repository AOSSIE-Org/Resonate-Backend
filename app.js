import express from "express";
import cors from "cors";
import { db } from "./firebase.js";
import { collection, getDocs, addDoc } from "firebase/firestore";

const PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Hello World");
});

//importing routes
import {roomRouter} from './routes/Room.js'
import { tokenRouter } from "./routes/Token.js";

//Connecting Endpoints to imported routes
app.use("/Room",roomRouter);
app.use('/Token',tokenRouter);

app.listen(PORT, () => {
  console.log(`Resonate Backend listening on port ${PORT}`);
});
