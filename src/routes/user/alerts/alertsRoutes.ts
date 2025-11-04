import { Router } from "express";
import { registerAlert, saveUserToken } from "../../../controllers/user/alerts/alertsController";
import { authenticate } from "../../../middlewares/auth";

const alertsRouter = Router();

alertsRouter.post('/register-alert', authenticate, registerAlert);
alertsRouter.post('/save-token', authenticate, saveUserToken);

export default alertsRouter;