import express from 'express';
const tokenRouter = express.Router();

//importing Controllers
import {generateToken} from '../controllers/GenerateToken.js'

tokenRouter.route('/generateToken').post(generateToken);

export {tokenRouter};