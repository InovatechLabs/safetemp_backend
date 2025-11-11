import { Router } from "express";
import { deleteAlert, list, listUserAlerts, registerAlert, saveUserToken } from "../../../controllers/user/alerts/alertsController";
import { authenticate } from "../../../middlewares/auth";

const alertsRouter = Router();

alertsRouter.post('/register-alert', authenticate, registerAlert);
alertsRouter.post('/save-token', authenticate, saveUserToken);
alertsRouter.get('/list', authenticate, listUserAlerts);

alertsRouter.delete('/delete/:id', authenticate, deleteAlert);
alertsRouter.get('/listall', list);

export default alertsRouter;