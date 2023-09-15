import express from "express";
import cors from "cors";
import { verifyAppwriteToken } from "./controllers/verifyAppwriteToken.js";

//importing routes
import { roomRouter } from "./routes/room.js";
import { tokenRouter } from "./routes/token.js";
import { webhookHandler } from "./controllers/webhookHandler.js";

const PORT = 3000;

const app = express();
app.use(cors());

// In order to use the validator, WebhookReceiver must have access to the raw POSTed string (instead of a parsed JSON object)
app.post(
    "/webhook",
    express.raw({ type: "application/webhook+json" }),
    webhookHandler
);

app.use(express.json());

app.get("/", async (req, res) => {
    res.send("Let's Resonate!");
});

app.use(async (req, res, next) => {
    const appwriteUser = await verifyAppwriteToken(req.headers.authorization);
    if (appwriteUser === null) {
        res.status(403).json({ msg: "Invalid Token" });
        return;
    } else {
        next();
    }
});

//Connecting Endpoints to imported routes
app.use("/room", roomRouter);
app.use("/token", tokenRouter);

app.listen(PORT, () => {
    console.log(`Resonate Backend listening on port ${PORT}`);
});
