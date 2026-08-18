import React from 'react';
import { BaseDashboardRenderer, type DashboardRendererProps } from 'device-dashboard-ui-plugin';

export class OilGaugeRenderer extends BaseDashboardRenderer {
  readonly type = 'oil-gauge';

  override validate(item: DashboardRendererProps['item']): string | null {
    if (!item.bind) {
      return 'OilGaugeRenderer required bind field.';
    }
    return null;
  }

  render({ item, telemetry }: DashboardRendererProps): React.ReactNode {
    const value = Number(telemetry[item.bind ?? ''] ?? 0);

    const color =
      value < 30
        ? '#ef4444'
        : value < 60
        ? '#f59e0b'
        : '#22c55e';

    return (
      <div
        style={{
          border: '1px solid #333',
          padding: '16px',
          borderRadius: '8px',
          background: '#18181b',
        }}
      >
        <div>
          <strong>{item.title ?? item.id}</strong>
        </div>

        <div
          style={{
            marginTop: '12px',
            height: '20px',
            background: '#27272a',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(Math.max(value, 0), 100)}%`,
              height: '100%',
              background: color,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
          {value} %
        </div>
      </div>
    );
  }
}