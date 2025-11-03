import ss from "simple-statistics";

export function detectOutliers(values: number[]) {
  const q1 = ss.quantile(values, 0.25);
  const q3 = ss.quantile(values, 0.75);
  const iqr = ss.interquartileRange(values);

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = values.filter(v => v < lowerBound || v > upperBound);

  return outliers;
}
