import swaggerJsdoc from "swagger-jsdoc";
import { firmwarePaths } from "./docs/paths/firmware/firmware.paths";
import { dataPaths } from "./docs/paths/data/data.paths";
import { firmwareSchemas } from "./docs/schemas/firmware/firmware.swagger";
import { dataSchemas } from "./docs/schemas/data/data.swagger";
import { reportsPaths } from "./docs/paths/reports/reports.paths";
import { reportsSchemas } from "./docs/schemas/reports/reports.swagger";
import { alertsSchemas } from "./docs/schemas/alerts/alerts.swagger";
import { alertsPaths } from "./docs/paths/alerts/alerts.paths";
import dotenv from 'dotenv';
import { notificationsPaths } from "./docs/paths/notifications/notifications.paths";
import { notificationsSchemas } from "./docs/schemas/notifications/notifications.swagger";
import { experimentosPaths } from "./docs/paths/experiments/experiments.paths";
import { experimentosSchemas } from "./docs/schemas/experiments/experiments.swagger";
import { twoFASchemas } from "./docs/schemas/2fa/2fa.swagger";
import { twoFAPaths } from "./docs/paths/2fa/2fa.paths";
import { usersPaths } from "./docs/paths/users/users.paths";
import { usersSchemas } from "./docs/schemas/users/users.swagger";

dotenv.config();

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SafeTemp API",
      version: "1.0.0",
      description: "Documentação da API SafeTemp",
    },
    servers: [
      {
        url: process.env.BACKEND_URL as string,
        description: "Servidor local",
      },
    ],
    paths: {
      ...firmwarePaths,
      ...dataPaths,
      ...reportsPaths,
      ...alertsPaths,
      ...notificationsPaths,
      ...experimentosPaths,
      ...twoFAPaths,
      ...usersPaths,
    },
    components: {
      schemas: {
        ...firmwareSchemas,
        ...dataSchemas,
        ...reportsSchemas,
        ...alertsSchemas,
        ...notificationsSchemas,
        ...experimentosSchemas,
        ...twoFASchemas,
        ...usersSchemas,
      },
    },
  },
  apis: [],
});