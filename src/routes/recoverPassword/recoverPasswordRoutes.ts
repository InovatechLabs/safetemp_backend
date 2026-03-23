import { Router } from "express";
import { createRecoverToken, validateToken, resetPassword } from "../../controllers/user/recoverPassword/recoverPasswordController";
import { authLimiter } from "../../middlewares/rateLimiter";

const recoverPasswordRouter = Router();

recoverPasswordRouter.post('/request', authLimiter, createRecoverToken);
recoverPasswordRouter.get('/validate/:token', validateToken);
recoverPasswordRouter.post('/reset', resetPassword);

export default recoverPasswordRouter;