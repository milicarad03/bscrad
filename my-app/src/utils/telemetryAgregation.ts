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
  static calculateStats(values: number[]): {
    avg: number;
    min: number;
    max: number;
    stdDev: number;
  } {
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, stdDev: 0 };
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    return { avg: Math.round(avg * 10) / 10, min, max, stdDev: Math.round(stdDev * 10) / 10 };
  }

  static calculateTrend(values: number[]): { trend: 'UP' | 'DOWN' | 'STABLE'; percent: number } {
    if (values.length < 2) {
      return { trend: 'STABLE', percent: 0 };
    }

    const firstQuarter = values.slice(0, Math.ceil(values.length / 4));
    const lastQuarter = values.slice(Math.floor((values.length * 3) / 4));

    const firstAvg =
      firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;

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
    const values = historicalData
      .map((item) => item[field])
      .filter((v) => typeof v === 'number');

    const stats = this.calculateStats(values);
    const { trend, percent } = this.calculateTrend(values);

    return {
      field,
      current: values[values.length - 1] || 0,
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
   /* const fields = historicalData.length? Object.keys(historicalData[0]).filter(
      key =>  key !== 'timestamp' && typeof historicalData[0][key] === 'number'): [];*/
    const fields = Array.from( new Set( historicalData.flatMap(item => Object.keys(item).filter( key =>
                key !== "timestamp" &&typeof item[key] === "number" ))));
    const metrics: { [key: string]: TelemetryMetric } = {};

    fields.forEach((field) => {
      const data = historicalData.filter((item) => item[field] !== undefined);
      if (data.length > 0) {
        metrics[field] = this.aggregateHistoricalData(data, field);
      }
    });

    const timestamps = historicalData
      .map((item) => new Date(item.timestamp).getTime())
      .filter((t) => !isNaN(t));

    const durationMs = Math.max(...timestamps) - Math.min(...timestamps);
    const durationMinutes = Math.round(durationMs / 1000 / 60);

    return {
      timestamp: new Date().toISOString(),
      sampleCount: historicalData.length,
      metrics,
      timeRange: {
        start: historicalData[0]?.timestamp || '',
        end: historicalData[historicalData.length - 1]?.timestamp || '',
        durationMinutes,
      },
    };
  }
}