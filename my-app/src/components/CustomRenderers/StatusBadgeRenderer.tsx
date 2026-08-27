import React from 'react';
import {
  BaseDashboardRenderer,
  type DashboardRendererProps,
} from 'device-dashboard-ui-plugin';

export class StatusBadgeRenderer extends BaseDashboardRenderer {
  readonly type = 'status-badge';

  override validate(item: DashboardRendererProps['item']): string | null {
    if (!item.bind) {
      return 'StatusBadgeRenderer requires bind field.';
    }
    return null;
  }

  render({ item, telemetry }: DashboardRendererProps): React.ReactNode {
    const status = String(telemetry[item.bind ?? ''] ?? 'UNKNOWN').toUpperCase();

    const statusConfig: Record<
      string,
      { label: string; color: string; bgColor: string; borderColor: string; description: string }
    > = {
      LOADED: {
        label: 'Loaded',
        color: '#16a34a',
        bgColor: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
        description: 'Generating air',
      },
      UNLOADED: {
        label: 'Unloaded',
        color: '#2563eb',
        bgColor: 'rgba(59, 130, 246, 0.08)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        description: 'Running unloaded',
      },
      STANDBY: {
        label: 'Standby',
        color: '#4f46e5',
        bgColor: 'rgba(99, 102, 241, 0.08)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        description: 'In standby mode',
      },
      FAULT: {
        label: 'Fault',
        color: '#dc2626',
        bgColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        description: 'Fault condition',
      },
      UNKNOWN: {
        label: 'Unknown',
        color: '#6b7280',
        bgColor: 'rgba(156, 163, 175, 0.08)',
        borderColor: 'rgba(156, 163, 175, 0.3)',
        description: 'Status unknown',
      },
    };

    const config = statusConfig[status] || statusConfig.UNKNOWN;

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
        {/* Header / Title */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--theme-text-secondary)',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {item.title ?? item.id}
        </div>

        {/* Compact Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '8px',
            background: config.bgColor,
            border: `1px solid ${config.borderColor}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: config.color,
                boxShadow: `0 0 8px ${config.color}`,
                animation: 'pulse 2s infinite',
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: config.color,
                  lineHeight: '1.2',
                }}
              >
                {config.label}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--theme-text-secondary)',
                  marginTop: '2px',
                }}
              >
                {config.description}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '10px',
              color: 'var(--theme-text-secondary)',
              opacity: 0.8,
              textAlign: 'right',
            }}
          >
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }
}