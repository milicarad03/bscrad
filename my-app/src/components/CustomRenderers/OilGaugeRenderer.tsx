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

    const statusColor =
      value < 30
        ? '#ef4444'
        : value < 60
        ? '#f59e0b'
        : '#22c55e';

    return (
      <div
        style={{
          border: 'var(--theme-card-border)',
          padding: 'var(--theme-space-md)',
          borderRadius: 'var(--theme-radius)',
          background: 'var(--theme-card-bg)',
          color: 'var(--theme-text-primary)',
          boxShadow: 'var(--theme-card-shadow)',
          backdropFilter: 'var(--theme-backdrop)',
          fontFamily: 'var(--theme-font)',
        }}
      >
        <div>
          <strong style={{ color: 'var(--theme-text-primary)' }}>
            {item.title ?? item.id}
          </strong>
        </div>

        <div
          style={{
            marginTop: '12px',
            height: '20px',
            background: 'var(--theme-input-bg)',
            border: 'var(--theme-input-border)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(Math.max(value, 0), 100)}%`,
              height: '100%',
              background: statusColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div style={{ marginTop: '8px', fontWeight: 'bold', color: 'var(--theme-text-secondary)' }}>
          {value} %
        </div>
      </div>
    );
  }
}