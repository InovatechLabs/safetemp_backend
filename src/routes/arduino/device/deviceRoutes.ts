import { Router } from "express";
import { sendCommand, listConnectedDevices } from "../../../controllers/arduino/device/deviceController";
import { activateDevice } from "../../../controllers/arduino/device/provisioningController";
import { apiLimiter, deviceCommandLimiter } from "../../../middlewares/rateLimiter";
import { authenticate } from "../../../middlewares/auth";
import { requireTenantAccess } from "../../../middlewares/tenantMiddleware";

const deviceRouter = Router();

deviceRouter.get('/connected', apiLimiter, authenticate, requireTenantAccess, listConnectedDevices);
deviceRouter.post('/:chipId/command', deviceCommandLimiter, authenticate, requireTenantAccess, sendCommand);

// ATIVAÇÃO DO HARDWARE (Provisionamento) - Rota pública, sem autenticação, mas com validação de token
// Será chamada pelo ESP32 no primeiro setup, usando o token gerado na compra (simulado por simulatePurchase.ts)
deviceRouter.post('/activate', apiLimiter, activateDevice);

export default deviceRouter;