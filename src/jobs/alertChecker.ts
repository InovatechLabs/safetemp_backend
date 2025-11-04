import cron from 'node-cron';
import { verificarAlertas } from '../services/alertService';

cron.schedule("* * * * *", () => {
  verificarAlertas();
});