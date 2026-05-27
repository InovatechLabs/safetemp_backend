import { Router } from "express";
import {
    deleteAlert,
    disableAlert,
    editAlertName,
    enableAlert,
    listUserAlerts,
    registerAlert,
    saveUserToken,
    saveWebPushToken
} from "../../../controllers/user/alerts/alertsController";
import { authenticate } from "../../../middlewares/auth";
import { apiLimiter } from "../../../middlewares/rateLimiter";
import { requireTenantAccess } from "../../../middlewares/tenantMiddleware";

const alertsRouter = Router();

alertsRouter.post('/register-alert', authenticate, requireTenantAccess, apiLimiter, registerAlert);
alertsRouter.post('/save-token', authenticate, saveUserToken);
alertsRouter.post('/save-web-token', authenticate, saveWebPushToken);
alertsRouter.get('/list', authenticate, listUserAlerts);

alertsRouter.delete('/delete/:id', authenticate, deleteAlert);
alertsRouter.patch('/disable/:id', authenticate, disableAlert);
alertsRouter.patch('/enable/:id', authenticate, enableAlert);
alertsRouter.patch('/editname/:id', apiLimiter, authenticate, editAlertName);

export default alertsRouter;