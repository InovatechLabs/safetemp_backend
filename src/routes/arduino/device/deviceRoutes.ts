import { Router } from "express";
import { sendCommand, listConnectedDevices } from "../../../controllers/arduino/device/deviceController";
import { apiLimiter, deviceCommandLimiter } from "../../../middlewares/rateLimiter";
import { authenticate } from "../../../middlewares/auth";

const deviceRouter = Router();

deviceRouter.get('/connected', apiLimiter, listConnectedDevices);
deviceRouter.post('/:chipId/command', deviceCommandLimiter, authenticate, sendCommand);

export default deviceRouter;