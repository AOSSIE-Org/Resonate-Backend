import express from "express";
import cors from "cors";
import { db } from "./firebase.js";
import { collection, getDocs, addDoc } from "firebase/firestore";

const PORT = 3000;

const app = express();
app.use(cors());

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Resonate Backend listening on port ${PORT}`);
});
