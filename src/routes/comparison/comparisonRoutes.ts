import { Router } from "express";
import { compareTemperatureRanges } from "../../controllers/comparison/comparisonController";
import { apiLimiter } from "../../middlewares/rateLimiter";
import { requireTenantAccess } from "../../middlewares/tenantMiddleware";
import { optionalAuth } from "../../middlewares/auth";

const comparisonRouter = Router();

comparisonRouter.post('/compare', apiLimiter, optionalAuth, requireTenantAccess, compareTemperatureRanges);

export default comparisonRouter;