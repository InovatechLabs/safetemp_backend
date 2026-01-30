import { dataPaths } from "../paths/data/data.paths";
import { firmwarePaths } from "../paths/firmware/firmware.paths";
import { reportsPaths } from "../paths/reports/reports.paths";
import { dataSchemas } from "../schemas/data/data.swagger";
import { firmwareSchemas } from "../schemas/firmware/firmware.swagger";
import { reportsSchemas } from "./reports/reports.swagger";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "SafeTemp API",
    version: "1.0.0"
  },
  paths: {
   ...dataPaths,
   ...firmwarePaths,
   ...reportsPaths
  },
  components: {
    schemas: {
      ...dataSchemas,
      ...firmwareSchemas,
      ...reportsSchemas
    }
  }
};