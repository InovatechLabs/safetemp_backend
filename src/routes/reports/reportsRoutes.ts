import { Router } from 'express';
import { exportPDF, getReportData, listReports, listReportsByDate, listReportsByInterval, listTodayReports } from '../../controllers/reports/reportsController';

const reportsRouter = Router();

reportsRouter.get('/list', listReports);
reportsRouter.get('/today', listTodayReports);
reportsRouter.get('/per-day', listReportsByDate);
reportsRouter.get('/interval', listReportsByInterval);
reportsRouter.get('/:id/data', getReportData);


reportsRouter.get('/reportpdf/:id', exportPDF);

export default reportsRouter;