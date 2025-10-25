import ss, { coefficientOfVariation } from "simple-statistics";
import { detectOutliers } from "./analytics/outliers";

export function calcStats(values: number[]) {

  if (values.length === 0) {
    return {
      media: null,
      mediana: null,
      desvioPadrao: null,
      min: null,
      max: null,
    };
  }

  const outliers = detectOutliers(values);
  const filteredValues = values.filter(v => !outliers.includes(v));

  return {
    media: ss.mean(values),
    mediaNoOutlier: ss.mean(filteredValues),
    mediana: ss.median(values),
    medianaNoOutlier: ss.median(filteredValues),
    desvioPadrao: ss.standardDeviation(values),
    min: Math.min(...values),
    max: Math.max(...values),
    variancia: ss.variance(values),
    CVOutlier: ss.coefficientOfVariation(values) * 100,
    CVNoOutlier: (ss.standardDeviation(filteredValues) / ss.mean(filteredValues)) * 100,
    outliers,
    totalOutliers: outliers.length,
    totalRecords: values.length,
  };
}
