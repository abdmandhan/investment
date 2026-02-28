"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  RefreshCw01,
  PieChart01,
} from "@untitledui/icons";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/base/buttons/button";
import { MetricsSimple } from "@/components/application/metrics/metrics";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { Badge } from "@/components/base/badges/badges";

interface InvestorDashboardData {
  metrics: {
    totalPortfolioValue: number;
    portfolioChange: number;
    totalUnits: number;
    totalReturn: number;
    totalReturnPercentage: number;
    returnChange: number;
  };
  portfolioHoldings: {
    fundId: number;
    fundName: string;
    fundCode: string;
    units: number;
    currentNAV: number;
    value: number;
    allocation: number;
    color: string;
  }[];
  performanceHistory: { date: string; value: number; benchmark: number }[];
  recentTransactions: {
    id: number;
    type: string;
    amount: number;
    units: number;
    date: string;
    fundName: string;
    fundCode: string;
    status: string;
  }[];
  monthlySummary: {
    month: string;
    subscriptions: number;
    redemptions: number;
    netInvestment: number;
  }[];
}

export default function InvestorDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<InvestorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/investor");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-tertiary">
          <RefreshCw01 className="size-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertCircle className="size-12 text-error-primary" />
        <p className="text-lg text-secondary">{error}</p>
        <Button onClick={fetchDashboardData} color="primary">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Investor Dashboard</h1>
          <p className="text-tertiary">View your investment portfolio and performance</p>
        </div>
        <Button iconLeading={RefreshCw01} color="secondary" onClick={fetchDashboardData}>
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsSimple
          title={formatCurrency(data.metrics.totalPortfolioValue)}
          subtitle="Total Portfolio Value"
          type="modern"
          trend={data.metrics.portfolioChange >= 0 ? "positive" : "negative"}
          change={formatPercentage(data.metrics.portfolioChange)}
        />
        <MetricsSimple
          title={formatNumber(data.metrics.totalUnits)}
          subtitle="Total Units"
          type="modern"
          trend="positive"
          change="All Funds"
        />
        <MetricsSimple
          title={formatCurrency(data.metrics.totalReturn)}
          subtitle="Total Return"
          type="modern"
          trend={data.metrics.totalReturn >= 0 ? "positive" : "negative"}
          change={formatPercentage(data.metrics.totalReturnPercentage)}
        />
        <MetricsSimple
          title={formatPercentage(data.metrics.totalReturnPercentage)}
          subtitle="Return Percentage"
          type="modern"
          trend={data.metrics.returnChange >= 0 ? "positive" : "negative"}
          change={formatPercentage(data.metrics.returnChange)}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Portfolio Allocation */}
        <div className="rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <h3 className="mb-4 text-lg font-semibold text-primary">Portfolio Allocation</h3>
          <div className="flex items-center gap-8">
            <div className="h-64 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart01 >
                  <Pie
                    data={data.portfolioHoldings}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="allocation"
                  >
                    {data.portfolioHoldings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg bg-primary-solid px-3 py-2 shadow-lg">
                            <p className="text-xs font-semibold text-white">{data.fundName}</p>
                            <p className="text-xs text-tooltip-supporting-text">
                              {formatCurrency(data.value)} ({data.allocation}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart01>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {data.portfolioHoldings.map((holding, index) => (
                <div key={holding.fundId} className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: holding.color || COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-secondary">{holding.fundCode}</span>
                  <span className="text-sm text-tertiary">({holding.allocation}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investment Performance */}
        <div className="rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <h3 className="mb-4 text-lg font-semibold text-primary">Investment Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.performanceHistory}>
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                  }
                  className="text-xs text-tertiary"
                />
                <YAxis
                  tickFormatter={(value) => `Rp${(value / 1e9).toFixed(1)}B`}
                  className="text-xs text-tertiary"
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  fill="url(#performanceGradient)"
                  className="text-utility-brand-600"
                  strokeWidth={2}
                  name="Your Portfolio"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="currentColor"
                  strokeDasharray="5 5"
                  className="text-utility-gray-400"
                  strokeWidth={2}
                  dot={false}
                  name="Benchmark"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Portfolio Holdings Table */}
      <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
        <div className="border-b border-secondary p-4">
          <h3 className="text-lg font-semibold text-primary">Portfolio Holdings</h3>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-tertiary">
                  <th className="pb-3 font-medium">Fund</th>
                  <th className="pb-3 font-medium text-right">Units</th>
                  <th className="pb-3 font-medium text-right">NAV/Unit</th>
                  <th className="pb-3 font-medium text-right">Value</th>
                  <th className="pb-3 font-medium text-right">Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {data.portfolioHoldings.map((holding) => (
                  <tr key={holding.fundId}>
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-secondary">{holding.fundName}</p>
                        <p className="text-sm text-tertiary">{holding.fundCode}</p>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm text-secondary">
                      {formatNumber(holding.units)}
                    </td>
                    <td className="py-3 text-right text-sm text-secondary">
                      {formatCurrency(holding.currentNAV)}
                    </td>
                    <td className="py-3 text-right text-sm font-medium text-secondary">
                      {formatCurrency(holding.value)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge color="brand" size="sm">
                        {holding.allocation}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Monthly Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Transactions */}
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
          <div className="border-b border-secondary p-4">
            <h3 className="text-lg font-semibold text-primary">Recent Transactions</h3>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-tertiary">
                    <th className="pb-3 font-medium">Fund</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {data.recentTransactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3">
                        <div>
                          <p className="text-sm font-medium text-secondary">{tx.fundName}</p>
                          <p className="text-xs text-tertiary">{tx.fundCode}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          color={
                            tx.type === "SUBSCRIPTION"
                              ? "success"
                              : tx.type === "REDEMPTION"
                                ? "error"
                                : "warning"
                          }
                          size="sm"
                        >
                          {tx.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-sm text-secondary">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          color={
                            tx.status === "COMPLETED"
                              ? "success"
                              : tx.status === "PENDING"
                                ? "warning"
                                : "gray"
                          }
                          size="sm"
                        >
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
          <div className="border-b border-secondary p-4">
            <h3 className="text-lg font-semibold text-primary">Monthly Summary</h3>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-tertiary">
                    <th className="pb-3 font-medium">Month</th>
                    <th className="pb-3 font-medium text-right">Subscriptions</th>
                    <th className="pb-3 font-medium text-right">Redemptions</th>
                    <th className="pb-3 font-medium text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {data.monthlySummary.map((month) => (
                    <tr key={month.month}>
                      <td className="py-3 text-sm text-secondary">{month.month}</td>
                      <td className="py-3 text-right text-sm text-success-primary">
                        +{formatCurrency(month.subscriptions)}
                      </td>
                      <td className="py-3 text-right text-sm text-error-primary">
                        -{formatCurrency(month.redemptions)}
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-secondary">
                        <span className={month.netInvestment >= 0 ? "text-success-primary" : "text-error-primary"}>
                          {month.netInvestment >= 0 ? "+" : ""}
                          {formatCurrency(month.netInvestment)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
