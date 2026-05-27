import { Router } from "express";
import { generateInsight } from "../../controllers/insight/insightController";
import { groqAILimiter } from "../../middlewares/rateLimiter";
import { authenticate } from "../../middlewares/auth";
import { requireTenantAccess } from "../../middlewares/tenantMiddleware";

const insightsRouter = Router();

insightsRouter.post("/quick-insight", authenticate, requireTenantAccess, generateInsight);

export default insightsRouter;