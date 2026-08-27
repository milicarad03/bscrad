import React from 'react';
import {
  BaseDashboardRenderer,
  type DashboardRendererProps,
} from 'device-dashboard-ui-plugin';

export class TemperatureThermometerRenderer extends BaseDashboardRenderer {
  readonly type = 'temperature-thermometer';

  override validate(item: DashboardRendererProps['item']): string | null {
    if (!item.bind) {
      return 'TemperatureThermometerRenderer requires bind field.';
    }
    return null;
  }

  render({ item, telemetry }: DashboardRendererProps): React.ReactNode {
    const value = Number(telemetry[item.bind ?? ''] ?? 0);

    const minTemp = typeof item.min === 'number' ? item.min : 0;
    const maxTemp = typeof item.max === 'number' ? item.max : 100;

    const normalizedValue = Math.min(Math.max(value, minTemp), maxTemp);
    const percentage = maxTemp > minTemp ? ((normalizedValue - minTemp) / (maxTemp - minTemp)) * 100 : 0;

    const rangeSpan = maxTemp - minTemp;
    const getTemperatureConfig = (temp: number) => {
      if (temp >= minTemp + rangeSpan * 0.85) {
        return { color: '#dc2626', label: 'Overheating', message: 'Critical temperature threshold exceeded' };
      }
      if (temp >= minTemp + rangeSpan * 0.65) {
        return { color: '#ea580c', label: 'High', message: 'Elevated discharge temperature' };
      }
      if (temp >= minTemp + rangeSpan * 0.3) {
        return { color: '#16a34a', label: 'Optimal', message: 'Normal operating range' };
      }
      if (temp >= minTemp + rangeSpan * 0.15) {
        return { color: '#2563eb', label: 'Warm', message: 'System warming up' };
      }
      return { color: '#4f46e5', label: 'Cool', message: 'Low operating temperature' };
    };

    const config = getTemperatureConfig(normalizedValue);
    const midTemp = Math.round((minTemp + maxTemp) / 2);

    return (
      <div
        style={{
          border: 'var(--theme-card-border)',
          padding: '14px 16px',
          borderRadius: 'var(--theme-radius)',
          background: 'var(--theme-card-bg)',
          color: 'var(--theme-text-primary)',
          boxShadow: 'var(--theme-card-shadow)',
          backdropFilter: 'var(--theme-backdrop)',
          fontFamily: 'var(--theme-font)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--theme-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {item.title ?? item.id}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '6px',
              background: `rgba(${config.color === '#dc2626' ? '220, 38, 38' : '22, 163, 74'}, 0.1)`,
              border: `1px solid ${config.color}`,
              color: config.color,
            }}
          >
            {config.label}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '10px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: config.color,
                lineHeight: '1.1',
                marginBottom: '4px',
              }}
            >
              {normalizedValue.toFixed(1)}°C
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--theme-text-secondary)',
              }}
            >
              {config.message}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '14px',
                height: '80px',
                border: `1px solid ${config.color}`,
                borderRadius: '8px',
                background: 'var(--theme-input-bg)',
                padding: '2px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '2px',
                  right: '2px',
                  height: `${percentage}%`,
                  background: config.color,
                  borderRadius: '6px',
                  transition: 'height 0.4s ease',
                  boxShadow: `0 0 6px ${config.color}`,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '80px',
                fontSize: '10px',
                color: 'var(--theme-text-secondary)',
                textAlign: 'right',
              }}
            >
              <span>{maxTemp}°</span>
              <span>{midTemp}°</span>
              <span>{minTemp}°</span>
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: '10px',
            color: 'var(--theme-text-secondary)',
            textAlign: 'center',
            paddingTop: '8px',
            borderTop: 'var(--theme-card-border)',
            opacity: 0.8,
          }}
        >
          Range: {minTemp}°C – {maxTemp}°C
        </div>
      </div>
    );
  }
}