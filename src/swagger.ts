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
    },
    components: {
      schemas: {
        ...firmwareSchemas,
        ...dataSchemas,
        ...reportsSchemas,
        ...alertsSchemas,
      },
    },
  },
  apis: [],
});