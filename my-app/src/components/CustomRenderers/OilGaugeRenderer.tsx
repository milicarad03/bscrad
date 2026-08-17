import type { DashboardRendererProps } from 'device-dashboard-ui-plugin';

export function OilGaugeRenderer({
  item,
  telemetry,
}: DashboardRendererProps) {
  const value = Number(
    telemetry[item.bind ?? ''] ?? 0,
  );

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
          background: '#222',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(
              Math.max(value, 0),
              100,
            )}%`,
            height: '100%',
            background: color,
          }}
        />
      </div>

      <div style={{ marginTop: '8px' }}>
        {value} %
      </div>
    </div>
  );
}