import express from "express";
const tokenRouter = express.Router();

//importing Controllers
import { generateToken } from "../controllers/generateToken.js";

tokenRouter.route("/generate-token").post(generateToken);

export { tokenRouter };
