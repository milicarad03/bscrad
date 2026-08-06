import type { HistoricalTelemetryPoint } from "../models/device-telemetry.dto";

export function transformTelemetryForCharts(
  telemetry: Record<string, any>
): HistoricalTelemetryPoint[] {
  const map = new Map<
    string,
    HistoricalTelemetryPoint
  >();

  Object.entries(telemetry).forEach(
    ([field, values]) => {
      if (!Array.isArray(values)) {
        return;
      }

      values.forEach(([value, timestamp]) => {
        if (!map.has(timestamp)) {
          map.set(timestamp, {
            timestamp
          } as HistoricalTelemetryPoint);
        }

        (map.get(timestamp) as any)[field] = value;
      });
    }
  );

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  );
}