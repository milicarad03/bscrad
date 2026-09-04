import React from 'react';
import { TelemetryAggregator } from '../../../../src/utils/telemetryAgregation';

import type {
  TelemetryMetric
} from '../../../../src/utils/telemetryAgregation';

import '../../layouts/agregation.css';
interface TelemetryAggregationCardProps {
  historicalData: any[];
  title?: string;
}


const MetricDisplay: React.FC<{ metric: TelemetryMetric; unit: string }> = ({
  metric,
  unit,
}) => {
  const getTrendIcon = (trend: string) => {
    if (trend === 'UP') return '📈';
    if (trend === 'DOWN') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'UP') return '#ff6b35'; 
    if (trend === 'DOWN') return '#3b82f6'; 
    return '#6b7280'; 
  };
    const range = metric.max - metric.min;

  const fillPercent =
    range === 0
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            ((metric.current - metric.min) / range) * 100
          )
        );



  return (
    <div className="metric-display">
      <div className="metric-header">
        <span className="metric-name">{metric.field.toUpperCase()}</span>
        <span className="metric-trend" style={{ color: getTrendColor(metric.trend) }}>
          {getTrendIcon(metric.trend)} {metric.trendPercent}%
        </span>
      </div>

      <div className="metric-main">
        <div className="metric-current">
          <span className="label">CURRENT</span>
          <span className="value">{metric.current.toFixed(1)}{unit}</span>
        </div>

        <div className="metric-avg">
          <span className="label">AVERAGE</span>
          <span className="value">{metric.average.toFixed(1)}{unit}</span>
        </div>
      </div>

      <div className="metric-range">
        <div className="range-item">
          <span className="label">MIN</span>
          <span className="value">{metric.min.toFixed(1)}{unit}</span>
        </div>
        <div className="range-item">
          <span className="label">MAX</span>
          <span className="value">{metric.max.toFixed(1)}{unit}</span>
        </div>
        <div className="range-item">
          <span className="label">σ (StdDev)</span>
          <span className="value">{metric.stdDev.toFixed(2)}</span>
        </div>
      </div>

  
      <div className="metric-bar">
        <div
          className="bar-fill"
          style={{
            width: `${fillPercent}%`,
            background: metric.trend === 'UP' ? '#ff6b35' : metric.trend === 'DOWN' ? '#3b82f6' : '#10b981',
          }}
        />
      </div>
    </div>
  );
};

export const TelemetryAggregationCard: React.FC<TelemetryAggregationCardProps> = ({
  historicalData,
  title = 'TELEMETRY_AGGREGATION',
}) => {
  const aggregated = TelemetryAggregator.aggregateAllMetrics(historicalData);

  const units: { [key: string]: string } = {
    temperature: '°C',
    humidity: '%',
    pressure: 'hPa',
  };

  return (
    <div className="aggregation-card">
      <div className="aggregation-header">
        <h3>{title}</h3>
        <div className="aggregation-info">
          <span className="info-item">
            <strong>Samples:</strong> {aggregated.sampleCount}
          </span>
          <span className="info-item">
            <strong>Duration:</strong> {aggregated.timeRange.durationMinutes}m
          </span>
          <span className="info-item">
            <strong>From:</strong> {new Date(aggregated.timeRange.start).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        {Object.entries(aggregated.metrics).map(([key, metric]) => (
          <MetricDisplay key={key} metric={metric} unit={units[key] || ''} />
        ))}
      </div>

      <div className="aggregation-summary">
        <h4>STATISTICS</h4>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Min</th>
              <th>Max</th>
              <th>Average</th>
              <th>StdDev</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(aggregated.metrics).map(([key, metric]) => (
              <tr key={key}>
                <td className="param-name">{key.toUpperCase()}</td>
                <td>{metric.min.toFixed(2)}</td>
                <td>{metric.max.toFixed(2)}</td>
                <td>{metric.average.toFixed(2)}</td>
                <td>{metric.stdDev.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
