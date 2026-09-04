import React from 'react';

import {
  BaseDashboardRenderer,
  type DashboardRendererProps,
} from 'device-dashboard-ui-plugin';

export class OilGaugeRenderer extends BaseDashboardRenderer {
  readonly type = 'oil-gauge';

  override validate(
    item: DashboardRendererProps['item'],
  ): string | null {
    if (!item.bind) {
      return 'OilGaugeRenderer requires bind field.';
    }

    return null;
  }

  render({
    item,
    telemetry,
  }: DashboardRendererProps): React.ReactNode {
    const value = Number(
      telemetry[item.bind ?? ''] ?? 0,
    );

    const boundedValue = Math.min(
      Math.max(value, 0),
      100,
    );

    /*
     * Ako je nivo kritično nizak, ostaje crven.
     * U svim ostalim slučajevima koristi accent boju
     * trenutno aktivne teme host aplikacije.
     */
    const barColor =
      value < 30
        ? '#ef4444'
        : 'var(--theme-primary, #3b82f6)';

    return (
      <div
        style={{
          height: '100%',
          padding: '16px',

          background:
            'var(--theme-card-bg, #ffffff)',

          border:
            'var(--theme-card-border, 1px solid #e2e8f0)',

          borderRadius:
            'var(--theme-radius, 8px)',

          boxShadow:
            'var(--theme-card-shadow, none)',

          color:
            'var(--theme-text-primary, #0f172a)',
        }}
      >
        <div>
          <strong>
            {item.title ?? item.id}
          </strong>
        </div>

        <div
          style={{
            marginTop: '12px',
            height: '20px',

            background:
              'var(--theme-input-bg, #f8fafc)',

            border:
              'var(--theme-input-border, 1px solid #cbd5e1)',

            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${boundedValue}%`,
              height: '100%',

              background: barColor,

              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div
          style={{
            marginTop: '8px',
            fontWeight: 700,

            color:
              'var(--theme-text-primary, #0f172a)',
          }}
        >
          {value} %
        </div>
      </div>
    );
  }
}