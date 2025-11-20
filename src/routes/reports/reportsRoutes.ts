import { Router } from 'express';
import { exportPDF, listReports } from '../../controllers/reports/reportsController';

const reportsRouter = Router();

reportsRouter.get('/list', listReports);
reportsRouter.get('/reportpdf/:id', exportPDF);

export default reportsRouter;