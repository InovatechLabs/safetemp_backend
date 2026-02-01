import { Router } from "express";
import { NotificationController } from "../../../controllers/user/notifications/notificationsController";
import { authenticate } from "../../../middlewares/auth";

const notificationsRouter = Router();

notificationsRouter.get('/list', authenticate, NotificationController.list);
notificationsRouter.patch('/read', authenticate, NotificationController.markAllAsRead);

export default notificationsRouter;