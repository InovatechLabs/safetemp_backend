export interface InsightThresholds {
  min: number;
  max: number;
  criticalMax: number;
}

export interface InsightStatistics {
  mean: number;
  max: number;
  min: number;
  stdDev?: number | null; 
  lastValue: number;
  outliers: number[];
  sampling: number[];
}

interface BaseInsightRequest {
  text: string;
  statistics: InsightStatistics;
}

export interface GeneralInsightRequest extends BaseInsightRequest {
  mode: 'general';
}

export interface ExperimentInsightRequest extends BaseInsightRequest {
  mode: 'experiment';
  culture: string;
  stage: string;
  thresholds: InsightThresholds;
  equipment: string[];
}

export type InsightRequest = GeneralInsightRequest | ExperimentInsightRequest;