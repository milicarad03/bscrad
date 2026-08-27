import React from 'react';
import {
  BaseDashboardRenderer,
  type DashboardRendererProps,
} from 'device-dashboard-ui-plugin';

export class SignalStrengthRenderer extends BaseDashboardRenderer {
  readonly type = 'signal-strength';

  override validate(item: DashboardRendererProps['item']): string | null {
    if (!item.bind) {
      return 'SignalStrengthRenderer requires bind field.';
    }
    return null;
  }

  render({ item, telemetry }: DashboardRendererProps): React.ReactNode {
    const value = Number(telemetry[item.bind ?? ''] ?? 0);
    const normalizedValue = Math.min(Math.max(value, 0), 100);
    const bars = Math.ceil((normalizedValue / 100) * 5);

    const getQualityLabel = (val: number): string => {
      if (val < 20) return 'Poor';
      if (val < 40) return 'Fair';
      if (val < 60) return 'Good';
      if (val < 80) return 'Very Good';
      return 'Excellent';
    };

    // Korišćenje univerzalnih tonova sa dobrim kontrastom
    const getQualityColor = (val: number): string => {
      if (val < 20) return '#dc2626'; // Red
      if (val < 40) return '#ea580c'; // Orange
      if (val < 60) return '#ca8a04'; // Yellow/Gold
      if (val < 80) return '#65a30d'; // Lime/Green
      return '#16a34a';               // Emerald Green
    };

    const qualityColor = getQualityColor(normalizedValue);
    const qualityLabel = getQualityLabel(normalizedValue);

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
              padding: '4px 8px',
              borderRadius: '4px',
              background: qualityColor,
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          >
            {qualityLabel}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '6px',
            height: '80px',
            marginBottom: '12px',
          }}
        >
          {[1, 2, 3, 4, 5].map((barIndex) => {
            const barHeight = `${barIndex * 12}px`;
            const isActive = barIndex <= bars;
            const barColor = isActive ? qualityColor : 'var(--theme-input-bg)';

            return (
              <div
                key={barIndex}
                style={{
                  width: '8px',
                  height: barHeight,
                  borderRadius: '2px',
                  background: barColor,
                  transition: 'all 0.3s ease',
                  opacity: isActive ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600',
            color: qualityColor,
          }}
        >
          {normalizedValue}%
        </div>
      </div>
    );
  }
}