export interface TemperatureStats {
  media: number;
  mediana: number;
  min: number;
  max: number;
  variancia: number;
  desvioPadrao: number;
  CVOutlier: number;
  CVNoOutlier: number;
  outliers: number[];
  totalOutliers: number;
  totalRecords: number;
}

export interface StatsDifference {
  absolute: number;
  percentage: number | null; 
}

export interface ComparisonMetrics {
  media: StatsDifference;
  mediana: StatsDifference;
  variancia: StatsDifference;
  desvioPadrao: StatsDifference;
  CVOutlier: StatsDifference;
  CVNoOutlier: StatsDifference;
  amplitude: StatsDifference;
}

export interface ComparisonAnalysis {
  moreStable: 'A' | 'B' | 'equal';
  lowerVariability: 'A' | 'B' | 'equal';
  moreOutliers: 'A' | 'B' | 'equal';
  percentualChangeMedia: number;
  percentualChangeVariancia: number;
}

export interface ComparisonResult {
  metrics: ComparisonMetrics;
  analysis: ComparisonAnalysis;
}

export interface BalanceAnalysis {
  recordsA: number;
  recordsB: number;
  ratio: number;           
  imbalanceLevel: "baixo" | "médio" | "alto";
  reliability: "boa" | "limitada" | "baixa";
}


