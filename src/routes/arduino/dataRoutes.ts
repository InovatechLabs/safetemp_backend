import { Router, text } from "express";
import { registerTemperature, getLastRecord, getTemperatures, getTemperatures6h, getHistory1h, exportCSV, batchRegisterTemperature } from "../../controllers/arduino/dataController";
import { heavyContentLimiter, apiLimiter } from "../../middlewares/rateLimiter";
import { authenticateDevice } from "../../middlewares/authenticateDevice";
import { logEvents } from "../../websocket/wsServer";

const dataRouter = Router();

dataRouter.post('/registertemp', text({ type: 'application/json' }), authenticateDevice, registerTemperature);
dataRouter.post('/registertemp/batch', text({ type: 'application/json' }), authenticateDevice, batchRegisterTemperature);
dataRouter.get("/lastdata", apiLimiter, getLastRecord);
dataRouter.get("/history", apiLimiter, getTemperatures);
dataRouter.get("/history6h", apiLimiter, getTemperatures6h);
dataRouter.get("/history1h", apiLimiter, getHistory1h);
dataRouter.get("/exportcsv", heavyContentLimiter, exportCSV);

dataRouter.get('/system-logs/stream', (req, res) => {
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

  const sendLog = (log: any) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
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