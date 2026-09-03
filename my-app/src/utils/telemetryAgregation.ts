// Tipovi za agregaciju
export interface TelemetryMetric {
  field: string;
  current: number;
  average: number;
  min: number;
  max: number;
  stdDev: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercent: number;
}

export interface AggregatedTelemetry {
  timestamp: string;
  sampleCount: number;
  metrics: {
    [key: string]: TelemetryMetric;
  };
  timeRange: {
    start: string;
    end: string;
    durationMinutes: number;
  };
}

// Agregacijske funkcije
export class TelemetryAggregator {
  private static extractNumericValues(value: unknown): number[] {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return [value];
    }

    if (!Array.isArray(value)) {
      return [];
    }

    if (
      value.length >= 2 &&
      typeof value[0] === 'number' &&
      Number.isFinite(value[0]) &&
      typeof value[1] === 'string'
    ) {
      return [value[0]];
    }

    return value.flatMap((entry) =>
      this.extractNumericValues(entry),
    );
  }

  static calculateStats(values: number[]): {
    avg: number;
    min: number;
    max: number;
    stdDev: number;
  } {
    const finiteValues = values.filter(Number.isFinite);

    if (finiteValues.length === 0) {
      return { avg: 0, min: 0, max: 0, stdDev: 0 };
    }

    const avg =
      finiteValues.reduce((a, b) => a + b, 0) /
      finiteValues.length;
    const min = Math.min(...finiteValues);
    const max = Math.max(...finiteValues);

    const variance =
      finiteValues.reduce(
        (sum, val) => sum + Math.pow(val - avg, 2),
        0,
      ) / finiteValues.length;
    const stdDev = Math.sqrt(variance);

    return { avg: Math.round(avg * 10) / 10, min, max, stdDev: Math.round(stdDev * 10) / 10 };
  }

  static calculateTrend(values: number[]): { trend: 'UP' | 'DOWN' | 'STABLE'; percent: number } {
    const finiteValues = values.filter(Number.isFinite);

    if (finiteValues.length < 2) {
      return { trend: 'STABLE', percent: 0 };
    }

    const firstQuarter = finiteValues.slice(
      0,
      Math.ceil(finiteValues.length / 4),
    );
    const lastQuarter = finiteValues.slice(
      Math.floor((finiteValues.length * 3) / 4),
    );

    const firstAvg =
      firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;

    if (firstAvg === 0) {
      if (lastAvg === 0) {
        return { trend: 'STABLE', percent: 0 };
      }

      return {
        trend: lastAvg > 0 ? 'UP' : 'DOWN',
        percent: 100,
      };
    }

    const change = ((lastAvg - firstAvg) / firstAvg) * 100;
    const percent = Math.round(Math.abs(change) * 10) / 10;

    if (Math.abs(change) < 2) {
      return { trend: 'STABLE', percent: 0 };
    }

    return { trend: change > 0 ? 'UP' : 'DOWN', percent };
  }

  static aggregateHistoricalData(
    historicalData: any[],
    field: string
  ): TelemetryMetric {
    const values = historicalData.flatMap((item) =>
      item && typeof item === 'object'
        ? this.extractNumericValues(item[field])
        : [],
    );

    const stats = this.calculateStats(values);
    const { trend, percent } = this.calculateTrend(values);

    return {
      field,
      current: values.at(-1) ?? 0,
      average: stats.avg,
      min: stats.min,
      max: stats.max,
      stdDev: stats.stdDev,
      trend,
      trendPercent: percent,
    };
  }

  static aggregateAllMetrics(
    historicalData: any[]
  ): AggregatedTelemetry {
    const fields = Array.from(
      new Set(
        historicalData.flatMap((item) => {
          if (!item || typeof item !== 'object') {
            return [];
          }

          return Object.keys(item).filter(
            (key) =>
              key !== 'timestamp' &&
              this.extractNumericValues(item[key]).length > 0,
          );
        }),
      ),
    );
    const metrics: { [key: string]: TelemetryMetric } = {};

    fields.forEach((field) => {
      const data = historicalData.filter(
        (item) =>
          item &&
          typeof item === 'object' &&
          this.extractNumericValues(item[field]).length > 0,
      );
      if (data.length > 0) {
        metrics[field] = this.aggregateHistoricalData(data, field);
      }
    });

    const timestamps = historicalData.flatMap((item) => {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.timestamp !== 'string'
      ) {
        return [];
      }

      const milliseconds = new Date(item.timestamp).getTime();

      return Number.isFinite(milliseconds)
        ? [{ value: item.timestamp, milliseconds }]
        : [];
    });

    const durationMinutes =
      timestamps.length < 2
        ? 0
        : Math.round(
            (Math.max(...timestamps.map((item) => item.milliseconds)) -
              Math.min(...timestamps.map((item) => item.milliseconds))) /
              1000 /
              60,
          );

    return {
      timestamp: new Date().toISOString(),
      sampleCount: historicalData.length,
      metrics,
      timeRange: {
        start: timestamps[0]?.value ?? '',
        end: timestamps.at(-1)?.value ?? '',
        durationMinutes,
      },
    };
  }
}