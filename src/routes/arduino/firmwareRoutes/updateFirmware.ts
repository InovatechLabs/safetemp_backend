import { Router } from "express";
import { downloadFirmware, firmwareVersion } from "../../../controllers/arduino/firmware/versionController";

const firmwareRouter = Router();

firmwareRouter.get("/version", firmwareVersion);
firmwareRouter.get("/download/:file", downloadFirmware);

export default firmwareRouter;