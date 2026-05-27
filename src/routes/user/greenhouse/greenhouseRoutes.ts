import { GreenhouseController } from '../../../controllers/user/greenhouses/greenhouseController';
import { Router } from 'express';
import { authenticate, optionalAuth } from '../../../middlewares/auth';

const greenhouseRouter = Router();

greenhouseRouter.get('/', optionalAuth, GreenhouseController.list);
greenhouseRouter.post('/', authenticate, GreenhouseController.create);

export default greenhouseRouter;