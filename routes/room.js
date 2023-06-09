import express from "express";
const roomRouter = express.Router();

//importing Controllers
import { createRoom } from "../controllers/createRoom.js";
import { deleteRoom } from "../controllers/deleteRoom.js";

roomRouter.route("/create-room").post(createRoom);
roomRouter.route("/delete-room").delete(deleteRoom);

export { roomRouter };
