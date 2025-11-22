import { Router } from 'express';
import { exportPDF, listReports, listReportsByDate, listReportsByInterval, listTodayReports } from '../../controllers/reports/reportsController';

const reportsRouter = Router();

reportsRouter.get('/list', listReports);
reportsRouter.get('/today', listTodayReports);
reportsRouter.get('/per-day', listReportsByDate);
reportsRouter.get('/interval', listReportsByInterval);

reportsRouter.get('/reportpdf/:id', exportPDF);

export default reportsRouter;