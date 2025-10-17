import { Router } from "express";
import { registerTemperature, getLastRecord, getTemperatures, getTemperatures6h } from "../../controllers/arduino/dataController";

const dataRouter = Router();

dataRouter.post("/registertemp", registerTemperature);
dataRouter.get("/lastdata", getLastRecord);
dataRouter.get("/history", getTemperatures);
dataRouter.get("/history6h", getTemperatures6h);

export default dataRouter;