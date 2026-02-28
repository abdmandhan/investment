"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  RefreshCw,
} from "@untitledui/icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/base/buttons/button";
import { MetricsSimple } from "@/components/application/metrics/metrics";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

interface SalesDashboardData {
  metrics: {
    personalAUM: number;
    aumChange: number;
    totalInvestors: number;
    investorsChange: number;
    monthlySalesTarget: number;
    currentMonthSales: number;
    targetProgress: number;
  };
  aumTrend: { date: string; value: number }[];
  recentTransactions: {
    id: number;
    type: string;
    amount: number;
    units: number;
    date: string;
    investorName: string;
    fundName: string;
  }[];
  topInvestors: {
    id: number;
    name: string;
    email: string;
    totalAUM: number;
    totalUnits: number;
    lastTransaction: string;
  }[];
  monthlySalesBreakdown: { month: string; sales: number }[];
}

export default function SalesDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<SalesDashboardData | null>(null);
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
      const response = await fetch("/api/dashboard/sales");
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
          <RefreshCw className="size-5 animate-spin" />
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

  const progressPercentage = Math.min(
    Math.round((data.metrics.currentMonthSales / data.metrics.monthlySalesTarget) * 100),
    100
  );

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Sales Dashboard</h1>
          <p className="text-tertiary">Track your sales performance and investor portfolio</p>
        </div>
        <Button iconLeading={RefreshCw} color="secondary" onClick={fetchDashboardData}>
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsSimple
          title={formatCurrency(data.metrics.personalAUM)}
          subtitle="Personal AUM"
          type="modern"
          trend={data.metrics.aumChange >= 0 ? "positive" : "negative"}
          change={`${data.metrics.aumChange >= 0 ? "+" : ""}${data.metrics.aumChange}%`}
        />
        <MetricsSimple
          title={formatNumber(data.metrics.totalInvestors)}
          subtitle="Total Investors"
          type="modern"
          trend={data.metrics.investorsChange >= 0 ? "positive" : "negative"}
          change={`${data.metrics.investorsChange >= 0 ? "+" : ""}${data.metrics.investorsChange}`}
        />
        <MetricsSimple
          title={formatCurrency(data.metrics.currentMonthSales)}
          subtitle="Current Month Sales"
          type="modern"
          trend="positive"
          change={`${progressPercentage}% of target`}
        />
        <MetricsSimple
          title={formatCurrency(data.metrics.monthlySalesTarget)}
          subtitle="Monthly Sales Target"
          type="modern"
          trend="positive"
          change="On track"
        />
      </div>

      {/* Sales Target Progress */}
      <div className="rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Monthly Sales Target Progress</h3>
          <Badge color={progressPercentage >= 100 ? "success" : progressPercentage >= 70 ? "warning" : "error"} size="sm">
            {progressPercentage >= 100 ? "Achieved" : progressPercentage >= 70 ? "On Track" : "Behind"}
          </Badge>
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-tertiary">
            {formatCurrency(data.metrics.currentMonthSales)} of {formatCurrency(data.metrics.monthlySalesTarget)}
          </span>
          <span className="font-medium text-secondary">{progressPercentage}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cx(
              "h-full rounded-full transition-all duration-500",
              progressPercentage >= 100
                ? "bg-success-primary"
                : progressPercentage >= 70
                ? "bg-warning-primary"
                : "bg-brand-primary"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* AUM Trend Chart */}
        <div className="rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <h3 className="mb-4 text-lg font-semibold text-primary">AUM Trend (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.aumTrend}>
                <defs>
                  <linearGradient id="aumGradientSales" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#aumGradientSales)"
                  className="text-utility-brand-600"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sales Breakdown */}
        <div className="rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <h3 className="mb-4 text-lg font-semibold text-primary">Monthly Sales Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlySalesBreakdown}>
                <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />
                <XAxis dataKey="month" className="text-xs text-tertiary" />
                <YAxis
                  tickFormatter={(value) => `Rp${(value / 1e9).toFixed(1)}B`}
                  className="text-xs text-tertiary"
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="currentColor" className="text-utility-brand-500" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Investors & Recent Transactions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Investors by AUM */}
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
          <div className="border-b border-secondary p-4">
            <h3 className="text-lg font-semibold text-primary">Top Investors by AUM</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {data.topInvestors.slice(0, 5).map((investor, index) => (
                <div
                  key={investor.id}
                  className="flex items-center justify-between rounded-lg bg-secondary_subtle p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-brand-solid text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-secondary">{investor.name}</p>
                      <p className="text-sm text-tertiary">{investor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-secondary">{formatCurrency(investor.totalAUM)}</p>
                    <p className="text-sm text-tertiary">{formatNumber(investor.totalUnits)} units</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
                    <th className="pb-3 font-medium">Investor</th>
                    <th className="pb-3 font-medium">Fund</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {data.recentTransactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 text-sm text-secondary">{tx.investorName}</td>
                      <td className="py-3 text-sm text-secondary">{tx.fundName}</td>
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
                      <td className="py-3 text-right text-sm text-secondary">{formatCurrency(tx.amount)}</td>
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
