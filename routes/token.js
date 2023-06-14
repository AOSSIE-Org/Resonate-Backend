import express from "express";
const tokenRouter = express.Router();

//importing Controllers
import { generateToken } from "../controllers/generateToken.js";

//TODO: A breaking change has been made. Currently this endpoint doesn't work. It will be corrected as and when required in the app
tokenRouter.route("/generate-token").post(generateToken);

export { tokenRouter };
