// ================= LIBRARIES ==================
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';
import http from 'http';

// ===================== ROUTERS =====================

import userRouter from './routes/user/userRoutes';
import dataRouter from './routes/arduino/dataRoutes';
import firmwareRouter from './routes/arduino/firmwareRoutes/updateFirmware';
import alertsRouter from './routes/user/alerts/alertsRoutes';
import TwoFARouter from './routes/user/2fa/2FARoutes';
import reportsRouter from './routes/reports/reportsRoutes';
import experimentsRouter from './routes/user/experiments/experimentsRoutes';
import comparisonRouter from './routes/comparison/comparisonRoutes';
import notificationsRouter from './routes/user/notifications/notificationsRoutes';
import insightsRouter from './routes/insights/insightsRoutes';
import recoverPasswordRouter from './routes/recoverPassword/recoverPasswordRoutes';
import deviceRouter from './routes/arduino/device/deviceRoutes';

// ===================== DOCS API =====================

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

// =============== JOBS & SCHEDULERS ===============
import './jobs/alertChecker';
import './scheduler/reportScheduler';
import './jobs/tokenCleaner';
import { startWatchdog } from './services/watchdog/watchdogService';
import { initWebSocketServer } from './websocket/wsServer';

dotenv.config({ path: ".env" });


const app = express();
const server = http.createServer(app);
app.use(helmet());
const prisma = new PrismaClient();

// ===================== MIDDLEWARES =====================
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            `${process.env.FRONTEND_URL}` as string,
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido por CORS'));
        }
    },
    credentials: true
}));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.set('trust proxy', 1);

// ===================== ROTAS =====================

app.use("/api/user", userRouter);    // Autenticação
app.use("/api/2fa", TwoFARouter); // Autenticação dois fatores
app.use("/api/recover", recoverPasswordRouter); // Recuperação de senha
app.use("/api/data", dataRouter);    // Registro de dados 
app.use("/api/firmware", firmwareRouter); // Atualização OTA do firmware 
app.use("/api/alerts", alertsRouter); // Funcionalidade de alertas
app.use("/api/reports", reportsRouter); // Rotas para relatórios
app.use("/api/experiments", experimentsRouter); // Rotas para experimentos
app.use("/api/comparison", comparisonRouter); // Comparação de dados
app.use("/api/notifications", notificationsRouter); // Visualização e gerenciamento de notificações
app.use("/api/insights", insightsRouter); // Geração de Insights com a IA
app.use("/api/device", deviceRouter); // Manipulação de device

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Documentação da API


async function startServer() {

    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

    try {
        
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Conectado ao banco com sucesso");

        initWebSocketServer(server);

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Servidor rodando em ${process.env.BACKEND_URL}`);
            startWatchdog();
        });
    } catch (error) {
        console.error(`❌ Erro ao iniciar servidor: `, error);
        process.exit(1);
    }
}

startServer();