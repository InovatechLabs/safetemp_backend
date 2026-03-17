import { Router } from "express";
import { generateInsight } from "../../controllers/insight/insightController";
import { groqAILimiter } from "../../middlewares/rateLimiter";
import { authenticate } from "../../middlewares/auth";

const insightsRouter = Router();

insightsRouter.post("/quick-insight", authenticate, generateInsight);

export default insightsRouter;