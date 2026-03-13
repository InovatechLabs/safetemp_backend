import { Router } from "express";
import { registerTemperature, getLastRecord, getTemperatures, getTemperatures6h, getHistory1h, exportCSV, batchRegisterTemperature } from "../../controllers/arduino/dataController";
import { heavyContentLimiter, apiLimiter } from "../../middlewares/rateLimiter";

const dataRouter = Router();

dataRouter.post("/registertemp", apiLimiter, registerTemperature);
dataRouter.post("/batch-upload", apiLimiter, batchRegisterTemperature);
dataRouter.get("/lastdata", apiLimiter, getLastRecord);
dataRouter.get("/history", apiLimiter, getTemperatures);
dataRouter.get("/history6h", apiLimiter, getTemperatures6h);
dataRouter.get("/history1h", apiLimiter, getHistory1h);
dataRouter.get("/exportcsv", heavyContentLimiter, exportCSV);

export default dataRouter;