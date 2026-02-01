import { ComparisonAnalysis, ComparisonMetrics, ComparisonResult, ComparisonSummary, StatsDifference, TemperatureStats } from "../../types/comparison/statistics";

function absoluteDiff(a: number, b: number): number {
  return b - a;
};

function percentageDiff(a: number, b: number): number | null {
  if (a === 0) return null;
  return ((b - a) / a) * 100;
};

function compareValues(
  a: number,
  b: number
): 'A' | 'B' | 'equal' {
  if (a < b) return 'A';
  if (b < a) return 'B';
  return 'equal';
};

export function compareStats(
  statsA: TemperatureStats,
  statsB: TemperatureStats
): ComparisonResult {

  const amplitudeA = statsA.max - statsA.min;
  const amplitudeB = statsB.max - statsB.min;

  const buildDiff = (a: number, b: number): StatsDifference => ({
    absolute: absoluteDiff(a, b),
    percentage: percentageDiff(a, b),
  });

  const metrics: ComparisonMetrics = {
    media: buildDiff(statsA.media, statsB.media),
    mediana: buildDiff(statsA.mediana, statsB.mediana),
    variancia: buildDiff(statsA.variancia, statsB.variancia),
    desvioPadrao: buildDiff(statsA.desvioPadrao, statsB.desvioPadrao),
    CVOutlier: buildDiff(statsA.CVOutlier, statsB.CVOutlier),
    CVNoOutlier: buildDiff(statsA.CVNoOutlier, statsB.CVNoOutlier),
    amplitude: buildDiff(amplitudeA, amplitudeB),
  };

  const analysis: ComparisonAnalysis = {
    moreStable: compareValues(statsA.CVNoOutlier, statsB.CVNoOutlier),
    lowerVariability: compareValues(statsA.variancia, statsB.variancia),
    moreOutliers: compareValues(statsA.totalOutliers, statsB.totalOutliers),
    percentualChangeMedia: ((statsB.media - statsA.media) / statsA.media) * 100,
    percentualChangeVariancia:
      ((statsB.variancia - statsA.variancia) / statsA.variancia) * 100,
  };

  return {
    metrics,
    analysis,
  };
};

export function buildComparisonSummary(
  comparison: ComparisonResult,
  balance: ReturnType<typeof sampleBalance>
): ComparisonSummary {

  const highlights: string[] = [];
  const tags: string[] = [];

  if (comparison.analysis.moreStable === "A") {
    highlights.push("O período A apresentou maior estabilidade térmica");
    tags.push("estabilidade");
  } else if (comparison.analysis.moreStable === "B") {
    highlights.push("O período B apresentou maior estabilidade térmica");
    tags.push("estabilidade");
  }

  if (Math.abs(comparison.analysis.percentualChangeVariancia) > 10) {
    const direction =
      comparison.analysis.percentualChangeVariancia > 0 ? "aumentou" : "reduziu";

    highlights.push(
      `A variância ${direction} ${Math.abs(
        comparison.analysis.percentualChangeVariancia
      ).toFixed(1)}% no período B`
    );
    tags.push("variância");
  }

  if (Math.abs(comparison.analysis.percentualChangeMedia) > 1) {
    highlights.push(
      `A média de temperatura variou ${comparison.analysis.percentualChangeMedia.toFixed(
        1
      )}% entre os períodos`
    );
    tags.push("média");
  }

  if (comparison.analysis.moreOutliers !== "equal") {
    const more =
      comparison.analysis.moreOutliers === "A" ? "A" : "B";
    highlights.push(`O período ${more} apresentou mais outliers`);
    tags.push("outliers");
  }

  if (balance.reliability !== "boa") {
    highlights.push(
      "A comparação possui confiabilidade limitada devido ao desequilíbrio de amostras"
    );
    tags.push("confiabilidade");
  }

  const headline =
    comparison.analysis.moreStable === "A"
      ? "O período A apresentou comportamento térmico mais estável"
      : comparison.analysis.moreStable === "B"
      ? "O período B apresentou comportamento térmico mais estável"
      : "Os períodos apresentaram comportamento térmico semelhante";

  return {
    headline,
    confidence:
      balance.reliability === "boa"
        ? "alta"
        : balance.reliability === "limitada"
        ? "média"
        : "baixa",
    highlights,
    tags,
  };
}

export function sampleBalance(nA: number, nB: number) {
  const ratio = Math.min(nA, nB) / Math.max(nA, nB);

  let imbalanceLevel: "baixo" | "médio" | "alto";
  let reliability: "boa" | "limitada" | "baixa";

  if (Math.min(nA, nB) < 30) {
    imbalanceLevel = "alto";
    reliability = "baixa";
  } else if (ratio >= 0.75) {
    imbalanceLevel = "baixo";
    reliability = "boa";
  } else if (ratio >= 0.4) {
    imbalanceLevel = "médio";
    reliability = "limitada";
  } else {
    imbalanceLevel = "alto";
    reliability = "baixa";
  }

  return { recordsA: nA, recordsB: nB, ratio, imbalanceLevel, reliability };
}