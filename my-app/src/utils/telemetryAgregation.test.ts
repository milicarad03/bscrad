import { describe, expect, it } from 'vitest';
import { TelemetryAggregator } from './telemetryAgregation';

describe('TelemetryAggregator', () => {
  it('returns an empty aggregation for empty telemetry', () => {
    const result = TelemetryAggregator.aggregateAllMetrics([]);

    expect(result.sampleCount).toBe(0);
    expect(result.metrics).toEqual({});
    expect(result.timeRange).toEqual({
      start: '',
      end: '',
      durationMinutes: 0,
    });
  });

  it('ignores malformed tuple values and aggregates valid tuples', () => {
    const result = TelemetryAggregator.aggregateAllMetrics([
      {
        timestamp: '2026-08-23T10:00:00.000Z',
        flowRate: [0, '2026-08-23T10:00:00.000Z'],
      },
      {
        timestamp: '2026-08-23T10:01:00.000Z',
        flowRate: ['invalid', '2026-08-23T10:01:00.000Z'],
      },
      {
        timestamp: '2026-08-23T10:02:00.000Z',
        flowRate: [20, '2026-08-23T10:02:00.000Z'],
      },
      {
        timestamp: 'not-a-date',
        flowRate: [],
      },
    ]);

    expect(result.metrics.flowRate).toMatchObject({
      current: 20,
      average: 10,
      min: 0,
      max: 20,
      trend: 'UP',
      trendPercent: 100,
    });
    expect(result.timeRange).toEqual({
      start: '2026-08-23T10:00:00.000Z',
      end: '2026-08-23T10:02:00.000Z',
      durationMinutes: 2,
    });
  });

  it('handles nested backend tuple arrays', () => {
    const metric = TelemetryAggregator.aggregateHistoricalData(
      [
        {
          flowRate: [
            [5, '2026-08-23T10:00:00.000Z'],
            ['invalid', '2026-08-23T10:01:00.000Z'],
            [15, '2026-08-23T10:02:00.000Z'],
          ],
        },
      ],
      'flowRate',
    );

    expect(metric).toMatchObject({
      current: 15,
      average: 10,
      min: 5,
      max: 15,
    });
  });

  it('returns a finite trend when the initial average is zero', () => {
    expect(TelemetryAggregator.calculateTrend([0, 20])).toEqual({
      trend: 'UP',
      percent: 100,
    });
    expect(TelemetryAggregator.calculateTrend([0, -20])).toEqual({
      trend: 'DOWN',
      percent: 100,
    });
    expect(TelemetryAggregator.calculateTrend([0, 0])).toEqual({
      trend: 'STABLE',
      percent: 0,
    });
  });

  it('ignores non-finite numbers in statistics and trends', () => {
    expect(
      TelemetryAggregator.calculateStats([
        Number.NaN,
        Number.POSITIVE_INFINITY,
      ]),
    ).toEqual({
      avg: 0,
      min: 0,
      max: 0,
      stdDev: 0,
    });
    expect(
      TelemetryAggregator.calculateTrend([
        Number.NaN,
        Number.POSITIVE_INFINITY,
      ]),
    ).toEqual({ trend: 'STABLE', percent: 0 });
  });
});
