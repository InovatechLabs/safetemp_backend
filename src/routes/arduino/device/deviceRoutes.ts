import { Router } from "express";
import { sendCommand, listConnectedDevices } from "../../../controllers/arduino/device/deviceController";
import { authenticate } from "../../../middlewares/auth";

const deviceRouter = Router();

deviceRouter.get('/connected', authenticate, listConnectedDevices);
deviceRouter.post('/:chipId/command', authenticate, sendCommand);

export default deviceRouter;