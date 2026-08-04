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
      time: new Date(item.timestamp).getTime(),
      temperature: Number(item.temperature.toFixed(1))
    }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          left: 10,
          bottom: 10
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />

       <XAxis
        dataKey="time"
        type="number"
        scale="time"
        domain={['dataMin', 'dataMax']}
        tickFormatter={(value) =>
          new Date(value).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
        tick={{ fontSize: 12 }}
        minTickGap={40}
      />

        <YAxis
          tick={{ fontSize: 12 }}
          unit="°C"
          domain={[
            (min: number) => Math.floor(min - 5),
            (max: number) => Math.ceil(max + 5)
          ]}
        />

        <Tooltip
          labelFormatter={(value) =>
            new Date(Number(value)).toLocaleString()
          }
          formatter={(value) => [
            `${Number(value).toFixed(1)} °C`,
            "Temperature"
          ]}
        />
        <Line
        type="monotone"
        dataKey="temperature"
        stroke="#ff6b35"
        strokeWidth={3}
        dot={false}
        activeDot={{ r: 6 }}
        animationDuration={500}
      />
      </LineChart>
    </ResponsiveContainer>
  );
}