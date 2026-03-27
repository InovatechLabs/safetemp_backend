import { Router, text } from "express";
import { registerTemperature, getLastRecord, getTemperatures, getTemperatures6h, getHistory1h, exportCSV, batchRegisterTemperature } from "../../controllers/arduino/dataController";
import { heavyContentLimiter, apiLimiter } from "../../middlewares/rateLimiter";
import { authenticateDevice } from "../../middlewares/authenticateDevice";

const dataRouter = Router();

dataRouter.post('/registertemp', text({ type: 'application/json' }), authenticateDevice, registerTemperature);
dataRouter.post('/registertemp/batch', text({ type: 'application/json' }), authenticateDevice, batchRegisterTemperature);
dataRouter.get("/lastdata", apiLimiter, getLastRecord);
dataRouter.get("/history", apiLimiter, getTemperatures);
dataRouter.get("/history6h", apiLimiter, getTemperatures6h);
dataRouter.get("/history1h", apiLimiter, getHistory1h);
dataRouter.get("/exportcsv", heavyContentLimiter, exportCSV);

export default dataRouter;