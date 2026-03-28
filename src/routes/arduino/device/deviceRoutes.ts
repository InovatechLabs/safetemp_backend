import { Router } from "express";
import { sendCommand, listConnectedDevices } from "../../../controllers/arduino/device/deviceController";
import { apiLimiter, deviceCommandLimiter } from "../../../middlewares/rateLimiter";

const deviceRouter = Router();

deviceRouter.get('/connected', apiLimiter, listConnectedDevices);
deviceRouter.post('/:chipId/command', deviceCommandLimiter, sendCommand);

export default deviceRouter;