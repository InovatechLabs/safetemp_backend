import { Router } from 'express';
import { exportPDF, getReportData, listReports, listReportsByDate, listReportsByInterval, listTodayReports } from '../../controllers/reports/reportsController';
import { apiLimiter, heavyContentLimiter } from '../../middlewares/rateLimiter';
import { requireTenantAccess } from '../../middlewares/tenantMiddleware';
import { optionalAuth } from '../../middlewares/auth';

const reportsRouter = Router();

reportsRouter.get('/list', optionalAuth, requireTenantAccess, listReports);
reportsRouter.get('/today', optionalAuth, requireTenantAccess, apiLimiter, listTodayReports);
reportsRouter.get('/per-day', optionalAuth, requireTenantAccess, apiLimiter, listReportsByDate);
reportsRouter.get('/interval', optionalAuth, requireTenantAccess, apiLimiter, listReportsByInterval);
reportsRouter.get('/:id/data', optionalAuth, requireTenantAccess, apiLimiter, getReportData);

reportsRouter.get('/reportpdf/:id', optionalAuth, requireTenantAccess, heavyContentLimiter, exportPDF);

export default reportsRouter;