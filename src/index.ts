import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import userRouter from './routes/user/userRoutes';
import dataRouter from './routes/arduino/dataRoutes';
import firmwareRouter from './routes/arduino/firmwareRoutes/updateFirmware';
import alertsRouter from './routes/user/alerts/alertsRoutes';
import './jobs/alertChecker';
import './scheduler/reportScheduler';
import TwoFARouter from './routes/user/2fa/2FARoutes';
import reportsRouter from './routes/reports/reportsRoutes';
import experimentsRouter from './routes/user/experiments/experimentsRoutes';
import comparisonRouter from './routes/comparison/comparisonRoutes';
import notificationsRouter from './routes/user/notifications/notificationsRoutes';
import { startWatchdog } from './services/watchdog/watchdogService';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { authenticate } from './middlewares/auth';

dotenv.config({ path: ".env" });


const app = express();
const prisma = new PrismaClient();

// ===================== MIDDLEWARES =====================
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173', 
            'http://127.0.0.1:5173',
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

// ===================== ROTAS =====================

app.use("/api/user", userRouter);    // Autenticação
app.use("/api/2fa", TwoFARouter); // Autenticação dois fatores
app.use("/api/data", dataRouter);    // Registro de dados 
app.use("/api/firmware", firmwareRouter); // Atualização OTA do firmware 
app.use("/api/alerts", alertsRouter); // Funcionalidade de alertas
app.use("/api/reports", reportsRouter); // Rotas para relatórios
app.use("/api/experiments", experimentsRouter); // Rotas para experimentos
app.use("/api/comparison", comparisonRouter); // Comparação de dados
app.use("/api/notifications", notificationsRouter); // Visualização e gerenciamento de notificações

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Documentação da API


async function startServer() {

    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

    try {
        
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Conectado ao banco com sucesso");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Servidor rodando em ${process.env.BACKEND_URL}`);
            startWatchdog();
        });
    } catch (error) {
        console.error(`❌ Erro ao iniciar servidor: `, error);
        process.exit(1);
    }
}

startServer();