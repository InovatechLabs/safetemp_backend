import { Router } from "express";
import { compareTemperatureRanges } from "../../controllers/comparison/comparisonController";

const comparisonRouter = Router();

comparisonRouter.post('/compare', compareTemperatureRanges);

export default comparisonRouter;