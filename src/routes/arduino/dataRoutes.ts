import { Router } from "express";
import { registerTemperature, getLastRecord, getTemperatures, getTemperatures6h, getHistory1h } from "../../controllers/arduino/dataController";

const dataRouter = Router();

dataRouter.post("/registertemp", registerTemperature);
dataRouter.get("/lastdata", getLastRecord);
dataRouter.get("/history", getTemperatures);
dataRouter.get("/history6h", getTemperatures6h);
dataRouter.get("/history1h", getHistory1h);

export default dataRouter;