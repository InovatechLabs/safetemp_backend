import { Router } from 'express';
import { ExperimentoController } from '../../../controllers/user/experiments/experimentsController';
import { authenticate } from '../../../middlewares/auth';

const experimentsRouter = Router();

experimentsRouter.post('/start', authenticate, ExperimentoController.iniciar);
experimentsRouter.patch('/end/:id', authenticate, ExperimentoController.finalizar);
experimentsRouter.get('/active/:mac_address', ExperimentoController.buscarAtivoPorDevice);

export default experimentsRouter;

