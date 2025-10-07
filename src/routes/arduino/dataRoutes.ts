import { Router } from "express";
import { registerTemperature, getLastRecord } from "../../controllers/arduino/dataController";

const dataRouter = Router();

dataRouter.post("/registertemp", registerTemperature);
dataRouter.get("/lastdata", getLastRecord);

export default dataRouter;