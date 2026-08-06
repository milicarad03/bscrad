import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import type { HistoricalTelemetryPoint } from "../../../models/device-telemetry.dto";

type HistoricalPoint = {
  timestamp: string;
  [key: string]: unknown;
};

type Props = {
  data: HistoricalTelemetryPoint[];
  field: string;
  label: string;
  unit?: string;
  color?: string;
};

export function TelemetryChart({
  data,
  field,
  label,
  unit = "",
  color = "#ff6b35"
}: Props) {
 const chartData = data
  .filter(item => typeof item[field] === "number")
  .map((item, index) => ({
    index,
    timestamp: item.timestamp,
    value: Number(item[field] as number)
  }));
    if (chartData.length === 0) {
    return (
        <div className="dd-empty-state">
        No telemetry available
        </div>
    );
    }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="index"
          tickFormatter={(value) => {
            const item = chartData.find(
              p => p.index === value
            );

            return item
              ? new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "";
          }}
          minTickGap={40}
        />

        <YAxis
          unit={unit}
          domain={[
            (min: number) => Math.floor(min - 5),
            (max: number) => Math.ceil(max + 5)
          ]}
        />

      <Tooltip
          labelFormatter={(value) => {
            const item = chartData.find(
              p => p.index === value
            );

            return item
              ? new Date(item.timestamp).toLocaleString()
              : "";
          }}
          formatter={(value) => [
            `${Number(value).toFixed(1)} ${unit}`,
            label
          ]}
        />

        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}