import React from 'react';
import { BaseDashboardRenderer, type DashboardRendererProps } from 'device-dashboard-ui-plugin';

export class DriveModeSelectorRenderer extends BaseDashboardRenderer {
  readonly type = 'drive-mode-selector';

  override validate(item: DashboardRendererProps['item']): string | null {
    if (!item.bind) {
      return 'DriveModeSelectorRenderer requires a "bind" field to read the current mode.';
    }
    if (!item.command) {
      return 'DriveModeSelectorRenderer requires a "command" field to send mode updates.';
    }
    return null;
  }

  render({ item, telemetry, onCommand, disabled }: DashboardRendererProps): React.ReactNode {
    const currentMode = String(telemetry[item.bind ?? ''] ?? 'NORMAL').toUpperCase();
    
    const modes = [
      { value: 'ECO', color: '#16a34a' },
      { value: 'NORMAL', color: '#2563eb' },
      { value: 'SPORT', color: '#d97706' },
      { value: 'RACE', color: '#7e22ce' }
    ];

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
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--theme-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          {item.title ?? item.id}
        </div>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {modes.map(({ value, color }) => {
            const isActive = currentMode === value;
            
            return (
              <button
                key={value}
                disabled={disabled}
                onClick={() => {
                  if (!disabled && onCommand && item.command) {
                    onCommand(item.command, { mode: value });
                  }
                }}
                style={{
                  padding: '10px 8px',
                  borderRadius: '6px',
                  border: isActive ? `1px solid ${color}` : '1px solid var(--theme-input-border)',
                  background: isActive ? `rgba(${color === '#16a34a' ? '22, 163, 74' : color === '#2563eb' ? '37, 99, 235' : color === '#d97706' ? '217, 119, 6' : '126, 34, 206'}, 0.1)` : 'var(--theme-input-bg)',
                  color: isActive ? color : 'var(--theme-text-secondary)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '12px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: disabled ? 0.5 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}