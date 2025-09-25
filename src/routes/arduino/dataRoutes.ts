import { Router } from "express";
import { registerTemperature } from "../../controllers/arduino/dataController";

const dataRouter = Router();

dataRouter.post("/registertemp", registerTemperature);

export default dataRouter;