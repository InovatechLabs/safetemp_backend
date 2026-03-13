import { Router } from 'express';
import { exportPDF, getReportData, listReports, listReportsByDate, listReportsByInterval, listTodayReports } from '../../controllers/reports/reportsController';
import { apiLimiter, heavyContentLimiter } from '../../middlewares/rateLimiter';

const reportsRouter = Router();

reportsRouter.get('/list', listReports);
reportsRouter.get('/today', apiLimiter, listTodayReports);
reportsRouter.get('/per-day', apiLimiter, listReportsByDate);
reportsRouter.get('/interval', apiLimiter, listReportsByInterval);
reportsRouter.get('/:id/data', apiLimiter, getReportData);


reportsRouter.get('/reportpdf/:id', heavyContentLimiter, exportPDF);

export default reportsRouter;