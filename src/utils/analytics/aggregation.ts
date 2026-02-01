interface TemperatureRecord {
  value: number;
  timestamp: Date;
}

export function aggregateByGranularity(
  records: TemperatureRecord[],
  granularityMinutes: number
) {
  const buckets = new Map<number, number[]>();

  records.forEach((r) => {
    const time = r.timestamp.getTime();
    const bucket =
      Math.floor(time / (granularityMinutes * 60 * 1000)) *
      granularityMinutes *
      60 *
      1000;

    if (!buckets.has(bucket)) {
      buckets.set(bucket, []);
    }

    buckets.get(bucket)!.push(r.value);
  });

return Array.from(buckets.entries())
  .map(([timestamp, values]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      timestamp: new Date(timestamp),
      value: Number(avg.toFixed(2)),
      samples: values.length,
    };
  })
  .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
