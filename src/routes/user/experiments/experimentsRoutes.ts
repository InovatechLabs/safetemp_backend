import { Router } from 'express';
import { ExperimentoController } from '../../../controllers/user/experiments/experimentsController';
import { authenticate, optionalAuth } from '../../../middlewares/auth';
import { apiLimiter } from '../../../middlewares/rateLimiter';
import { requireTenantAccess } from '../../../middlewares/tenantMiddleware';

const experimentsRouter = Router();

experimentsRouter.post('/start', authenticate, requireTenantAccess, ExperimentoController.iniciar);
experimentsRouter.patch('/end/:id', authenticate, requireTenantAccess, ExperimentoController.finalizar);
experimentsRouter.get('/active/:mac_address', optionalAuth, requireTenantAccess, ExperimentoController.buscarAtivoPorDevice);
experimentsRouter.get('/per-day', apiLimiter, optionalAuth, requireTenantAccess, ExperimentoController.buscarPorData);
experimentsRouter.get('/today', apiLimiter, optionalAuth, requireTenantAccess, ExperimentoController.listarExperimentosDeHoje);
experimentsRouter.get('/list', apiLimiter, ExperimentoController.listarPublicos);

export default experimentsRouter;

