import express from 'express';
const tokenRouter = express.Router();

//importing Controllers
import {generateToken} from '../controllers/generateToken.js'

tokenRouter.route('/generateToken').post(generateToken);

export {tokenRouter};