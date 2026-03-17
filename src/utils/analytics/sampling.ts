import { TemperatureRecord } from "../types";

export const getSampling = (records: TemperatureRecord[]) => {
  if (!records || records.length === 0) return [];
  if (records.length <= 6) return records.map(r => r.value);
  
  const step = Math.floor(records.length / 5);
  const sampling = [];
  for (let i = 0; i < 5; i++) {
    sampling.push(records[i * step].value);
  }
  sampling.push(records[records.length - 1].value); 
  return sampling;
};