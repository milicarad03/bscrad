import React from 'react';
import {
  BaseDashboardRenderer,
  type DashboardRendererProps,
} from 'device-dashboard-ui-plugin';

export class BatteryIndicatorRenderer extends BaseDashboardRenderer {
  readonly type = 'battery-indicator';

  override validate(item: DashboardRendererProps['item']): string | null {
    if (!item.bind) {
      return 'BatteryIndicatorRenderer requires bind field.';
    }
    return null;
  }

  render({ item, telemetry }: DashboardRendererProps): React.ReactNode {
    const value = Number(telemetry[item.bind ?? ''] ?? 0);
    const normalizedValue = Math.min(Math.max(value, 0), 100);

    const getStatusLabel = (value: number): string => {
      if (value < 10) return 'Critical';
      if (value < 25) return 'Low';
      if (value < 50) return 'Medium';
      if (value < 75) return 'Good';
      return 'Full';
    };

    const getStatusColor = (value: number): string => {
      if (value < 10) return '#ef4444';
      if (value < 25) return '#f97316';
      if (value < 50) return '#eab308';
      if (value < 75) return '#84cc16';
      return '#22c55e';
    };

    const statusColor = getStatusColor(normalizedValue);
    const statusLabel = getStatusLabel(normalizedValue);

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <strong style={{ color: 'var(--theme-text-primary)' }}>
            {item.title ?? item.id}
          </strong>
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: statusColor,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Battery Visual */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            justifyContent: 'center',
          }}
        >
          {/* Battery Body */}
          <div
            style={{
              width: '60px',
              height: '100px',
              border: `2px solid ${statusColor}`,
              borderRadius: '8px',
              padding: '4px',
              background: 'var(--theme-input-bg)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Battery Fill */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${normalizedValue}%`,
                background: statusColor,
                transition: 'height 0.3s ease',
              }}
            />

            {/* Battery Percentage Text */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--theme-text-primary)',
                textShadow:
                  normalizedValue > 50
                    ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                    : 'none',
              }}
            >
              {normalizedValue}%
            </div>
          </div>

          {/* Battery Terminal */}
          <div
            style={{
              width: '8px',
              height: '30px',
              background: statusColor,
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Additional Info */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--theme-text-secondary)',
            textAlign: 'center',
            paddingTop: '8px',
            borderTop: 'var(--theme-card-border)',
          }}
        >
          {normalizedValue < 10 && '⚠️ Charging required soon'}
          {normalizedValue >= 10 && normalizedValue < 25 && '⚠️ Please charge'}
          {normalizedValue >= 25 && normalizedValue < 75 && '✓ Normal operation'}
          {normalizedValue >= 75 && '✓ Battery healthy'}
        </div>
      </div>
    );
  }
}