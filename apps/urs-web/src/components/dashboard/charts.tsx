"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cx } from "@/utils/cx";
import { ChartTooltipContent, ChartLegendContent } from "@/components/application/charts/charts-base";

// AUM Trend Chart
interface AUMTrendChartProps {
  data: { date: string; value: number }[];
  className?: string;
  height?: number;
}

export const AUMTrendChart = ({ data, className, height = 300 }: AUMTrendChartProps) => {
  const id = useId();
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const formatValue = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5", className)}>
      <h3 className="text-md font-semibold text-primary mb-4">AUM Trend</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7F56D9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7F56D9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatValue}
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#7F56D9"
            strokeWidth={2}
            fill={`url(#gradient-${id})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Fund Performance Chart
interface FundPerformanceChartProps {
  data: Record<number, { date: string; nav: number }[]>;
  fundColors: Record<number, string>;
  fundNames: Record<number, string>;
  className?: string;
  height?: number;
}

export const FundPerformanceChart = ({ 
  data, 
  fundColors, 
  fundNames,
  className, 
  height = 300 
}: FundPerformanceChartProps) => {
  // Transform data for multi-line chart
  const fundIds = Object.keys(data).map(Number);
  if (fundIds.length === 0) return null;

  // Create combined data points
  const allDates = [...new Set(fundIds.flatMap(id => data[id].map(d => d.date)))].sort();
  const combinedData = allDates.map(date => {
    const point: Record<string, number | string> = { date };
    fundIds.forEach(fundId => {
      const navData = data[fundId].find(d => d.date === date);
      point[`fund_${fundId}`] = navData?.nav || 0;
    });
    return point;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5", className)}>
      <h3 className="text-md font-semibold text-primary mb-4">Fund Performance (NAV)</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          {fundIds.map(fundId => (
            <Line
              key={fundId}
              type="monotone"
              dataKey={`fund_${fundId}`}
              name={fundNames[fundId] || `Fund ${fundId}`}
              stroke={fundColors[fundId] || "#7F56D9"}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Transaction Volume Chart
interface TransactionVolumeChartProps {
  data: { type: string; amount: number; count: number }[];
  className?: string;
  height?: number;
}

export const TransactionVolumeChart = ({ data, className, height = 250 }: TransactionVolumeChartProps) => {
  const colors: Record<string, string> = {
    SUBSCRIPTION: "#12B76A",
    REDEMPTION: "#F04438",
    SWITCHING_IN: "#7F56D9",
    SWITCHING_OUT: "#F79009",
  };

  const labels: Record<string, string> = {
    SUBSCRIPTION: "Subscription",
    REDEMPTION: "Redemption",
    SWITCHING_IN: "Switch In",
    SWITCHING_OUT: "Switch Out",
  };

  const formattedData = data.map(d => ({
    ...d,
    name: labels[d.type] || d.type,
    fill: colors[d.type] || "#7F56D9",
  }));

  const formatValue = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5", className)}>
      <h3 className="text-md font-semibold text-primary mb-4">Transaction Volume</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={formattedData} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" horizontal={true} vertical={false} />
          <XAxis 
            type="number"
            tickFormatter={formatValue}
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke="#475467"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                  <p className="font-semibold">{data.name}</p>
                  <p className="text-sm">Amount: {formatValue(data.amount)}</p>
                  <p className="text-sm">Count: {data.count} transactions</p>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Portfolio Allocation Pie Chart
interface PortfolioAllocationChartProps {
  data: { fundName: string; value: number; percentage: number; color?: string }[];
  className?: string;
  height?: number;
}

export const PortfolioAllocationChart = ({ data, className, height = 300 }: PortfolioAllocationChartProps) => {
  const defaultColors = ["#7F56D9", "#12B76A", "#F79009", "#F04438", "#0BA5EC", "#6172F3", "#EE46BC"];
  
  const formattedData = data.map((item, index) => ({
    ...item,
    fill: item.color || defaultColors[index % defaultColors.length],
  }));

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5", className)}>
      <h3 className="text-md font-semibold text-primary mb-4">Portfolio Allocation</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="fundName"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                  <p className="font-semibold">{data.fundName}</p>
                  <p className="text-sm">{formatValue(data.value)}</p>
                  <p className="text-sm">{data.percentage}% of portfolio</p>
                </div>
              );
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => `${value} (${entry.payload.percentage}%)`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Daily Flow Chart
interface DailyFlowChartProps {
  data: { date: string; amount: number }[];
  className?: string;
  height?: number;
}

export const DailyFlowChart = ({ data, className, height = 250 }: DailyFlowChartProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5", className)}>
      <h3 className="text-md font-semibold text-primary mb-4">Daily Transaction Flow</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#98A2B3"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatValue}
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar dataKey="amount" fill="#7F56D9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Investor Acquisition Chart
interface AcquisitionTrendChartProps {
  data: { month: string; count: number }[];
  className?: string;
  height?: number;
}

export const AcquisitionTrendChart = ({ data, className, height = 250 }: AcquisitionTrendChartProps) => {
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { month: 'short' });
  };

  return (
    <div className={cx("rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5", className)}>
      <h3 className="text-md font-semibold text-primary mb-4">Investor Acquisition Trend</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="acquisitionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#12B76A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#12B76A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#98A2B3"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#12B76A"
            strokeWidth={2}
            fill="url(#acquisitionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
