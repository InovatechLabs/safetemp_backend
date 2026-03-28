import { Router } from "express";
import { sendCommand, listConnectedDevices } from "../../../controllers/arduino/device/deviceController";
import { apiLimiter } from "../../../middlewares/rateLimiter";

const deviceRouter = Router();

deviceRouter.get('/connected', apiLimiter, listConnectedDevices);
deviceRouter.post('/:chipId/command', apiLimiter, sendCommand);

export default deviceRouter;