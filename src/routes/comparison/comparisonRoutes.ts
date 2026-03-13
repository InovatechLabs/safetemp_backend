import { Router } from "express";
import { compareTemperatureRanges } from "../../controllers/comparison/comparisonController";
import { apiLimiter } from "../../middlewares/rateLimiter";

const comparisonRouter = Router();

comparisonRouter.post('/compare', apiLimiter, compareTemperatureRanges);

export default comparisonRouter;