import express from "express";
const roomRouter = express.Router();

//importing Controllers
import { createRoom } from "../controllers/createRoom.js";
import { joinRoom } from "../controllers/joinRoom.js";
import { deleteRoom } from "../controllers/deleteRoom.js";

roomRouter.route("/create-room").post(createRoom);
roomRouter.route("/join-room").post(joinRoom);
roomRouter.route("/delete-room").delete(deleteRoom);

export { roomRouter };
