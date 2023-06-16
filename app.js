import express from "express";
import cors from "cors";

//importing routes
import { roomRouter } from "./routes/room.js";
import { tokenRouter } from "./routes/token.js";

const PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());

//Connecting Endpoints to imported routes
app.use("/room", roomRouter);
app.use("/token", tokenRouter);

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Resonate Backend listening on port ${PORT}`);
});
