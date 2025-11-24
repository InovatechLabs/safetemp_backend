import { Router } from "express";
import {
    deleteAlert,
    disableAlert,
    enableAlert,
    list,
    listUserAlerts,
    registerAlert,
    saveUserToken
} from "../../../controllers/user/alerts/alertsController";
import { authenticate } from "../../../middlewares/auth";

const alertsRouter = Router();

alertsRouter.post('/register-alert', authenticate, registerAlert);
alertsRouter.post('/save-token', authenticate, saveUserToken);
alertsRouter.get('/list', authenticate, listUserAlerts);

alertsRouter.delete('/delete/:id', authenticate, deleteAlert);
alertsRouter.put('/disable/:id', authenticate, disableAlert);
alertsRouter.put('/enable/:id', authenticate, enableAlert);
alertsRouter.get('/listall', list);

alertsRouter.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is operational' });
});

export default alertsRouter;