import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

type HistoricalPoint = {
  timestamp: string;
  temperature: number;
};

type Props = {
  data: HistoricalPoint[];
};

export function TemperatureChart({ data }: Props) {
  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    temperature: item.temperature
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="time" />

        <YAxis />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#ff6b35"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}