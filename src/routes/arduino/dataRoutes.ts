import { Router, text } from "express";
import { registerTemperature, getLastRecord, getTemperatures, getTemperatures6h, getHistory1h, exportCSV, batchRegisterTemperature } from "../../controllers/arduino/dataController";
import { heavyContentLimiter, apiLimiter } from "../../middlewares/rateLimiter";
import { authenticateDevice } from "../../middlewares/authenticateDevice";
import { requireTenantAccess } from "../../middlewares/tenantMiddleware";
import { logEvents } from "../../websocket/wsServer";
import { PrismaClient } from "@prisma/client";
import { authenticate, optionalAuth } from "../../middlewares/auth";

const prisma = new PrismaClient();

const dataRouter = Router();

dataRouter.post('/registertemp', text({ type: 'application/json' }), authenticateDevice, registerTemperature);
dataRouter.post('/registertemp/batch', text({ type: 'application/json' }), authenticateDevice, batchRegisterTemperature);

dataRouter.get("/lastdata", apiLimiter, optionalAuth, requireTenantAccess, getLastRecord);
dataRouter.get("/history", apiLimiter, optionalAuth, requireTenantAccess, getTemperatures);
dataRouter.get("/history6h", apiLimiter, optionalAuth, requireTenantAccess, getTemperatures6h);
dataRouter.get("/history1h", apiLimiter, optionalAuth, requireTenantAccess, getHistory1h);
dataRouter.get("/exportcsv", heavyContentLimiter, optionalAuth, requireTenantAccess, exportCSV)

dataRouter.get('/system-logs/stream', authenticate, requireTenantAccess, (req, res) => {
  const greenhouse = (req as any).greenhouse;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(': ok\n\n');

 const welcomeLog = {
    id: Date.now(),
    level: 'INFO',
    message: 'Conexão com o fluxo de eventos estabelecida.',
    timestamp: new Date().toISOString()
  };
  res.write(`data: ${JSON.stringify(welcomeLog)}\n\n`);

  const sendLog = async (log: any) => {
    const device = await prisma.device.findUnique({ where: { mac_address: log.chipId } });
    if (device && device.greenhouseId === greenhouse.id) {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
    }
  };
  
  logEvents.on('new_log', sendLog);

  const sseHeartbeat = setInterval(() => {
    res.write(': heartbeat\n\n'); 
  }, 30000);

  req.on('close', () => {
    clearInterval(sseHeartbeat);
    logEvents.off('new_log', sendLog);
    res.end(); 
  });
});

export default dataRouter;