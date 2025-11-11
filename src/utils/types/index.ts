export interface TemperatureRecord {
  id: number;
  chipId: string;
  value: number;
  timestamp: string;
}

export interface HistoryResponse {
  records: TemperatureRecord[];
  statistics?: Record<string, any>;
}

export interface PythonResponse {
  relatorio: string;
  resumo: {
    intervalo: string;
    registros: number;
    media: number;
    min: number;
    max: number;
  };
}