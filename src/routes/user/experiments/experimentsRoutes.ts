import { Router } from 'express';
import { ExperimentoController } from '../../../controllers/user/experiments/experimentsController';
import { authenticate } from '../../../middlewares/auth';
import { apiLimiter } from '../../../middlewares/rateLimiter';

const experimentsRouter = Router();

experimentsRouter.post('/start', authenticate, ExperimentoController.iniciar);
experimentsRouter.patch('/end/:id', authenticate, ExperimentoController.finalizar);
experimentsRouter.get('/active/:mac_address', ExperimentoController.buscarAtivoPorDevice);
experimentsRouter.get('/list', apiLimiter, ExperimentoController.listarPublicos);
experimentsRouter.get('/per-day', apiLimiter, ExperimentoController.buscarPorData);
experimentsRouter.get('/today', apiLimiter, ExperimentoController.listarExperimentosDeHoje);

export default experimentsRouter;

