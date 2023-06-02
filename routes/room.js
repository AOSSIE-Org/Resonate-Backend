import express from 'express';
const roomRouter = express.Router();

//importing Controllers
import {createRoom} from '../controllers/createRoom.js'

roomRouter.route('/createRoom').post(createRoom);

export {roomRouter};