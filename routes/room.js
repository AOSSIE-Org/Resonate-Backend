import express from 'express';
const roomRouter = express.Router();

//importing Controllers
import {createRoom} from '../controllers/createRoom.js'
import {deleteRoom} from '../controllers/deleteRoom.js';

roomRouter.route('/createRoom').post(createRoom);
roomRouter.route('/deleteRoom').post(deleteRoom);

export {roomRouter};