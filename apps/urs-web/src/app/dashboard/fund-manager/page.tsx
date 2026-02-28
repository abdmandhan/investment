"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { Table, TableCard } from "@/components/application/table/table";
import { RefreshCw, AlertCircle, Building02, DollarLine, Users01, TrendUp01, TrendDown01, ArrowDownLeft, ArrowUpRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface FundManagerDashboardData {
  funds: Array<{
    id: number;
    name: string;
    code: string;
    color: string | null;
    aum: number;
    investorCount: number;
    currentNAV: number;
    outstandingUnits: number;
    totalNAV: number;
    ytdReturn: number;
    return30d: number;
    managementFeeRate: number;
    estimatedMonthlyFee: number;
    isActive: boolean;
    canSubscribe: boolean;
    canRedeem: boolean;
    canSwitch: boolean;
  }>;
  summary: {
    totalFunds: number;
    totalAUM: number;
    totalInvestors: number;
    totalSubscriptions: number;
    totalRedemptions: number;
    netFlow: number;
    subscriptionCount: number;
    redemptionCount: number;
    totalFeesCollected: number;
  };
  navHistoryByFund: Record<number, { date: string; nav: number; totalNav: number; outstandingUnits: number }[]>;
  dailyFlow: Array<{ date: string; amount: number; count: number }>;
  recentTransactions: Array<{
    id: number;
    type: string;
    amount: number;
    units: number;
    date: string;
    investorName: string;
    fundName: string;
    fundCode: string;
  }>;
  fundPerformance: Array<{
    fundId: number;
    fundName: string;
    fundCode: string;
    color: string | null;
    ytdReturn: number;
    return30d: number;
    aum: number;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
};

const formatValue = (value: number) => {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString();
};

export default function FundManagerDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<FundManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const hasAccess =
        session?.user?.roles?.includes("fund_manager") ||
        session?.user?.roles?.includes("admin") ||
        session?.user?.permissions?.includes("dashboard:fund_manager:view");

      if (!hasAccess) {
        router.push("/");
        return;
      }

      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/fund-manager");

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/");
          return;
        }
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

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="size-8 text-brand-secondary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="size-12 text-error-primary" />
        <p className="text-error-primary">{error}</p>
        <Button onClick={fetchDashboardData} iconLeading={RefreshCw}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const fundColors = data.funds.reduce((acc, fund) => {
    acc[fund.id] = fund.color || "#7F56D9";
    return acc;
  }, {} as Record<number, string>);

  const fundNames = data.funds.reduce((acc, fund) => {
    acc[fund.id] = fund.code;
    return acc;
  }, {} as Record<number, string>);

  const transactionVolumeData = [
    { type: "SUBSCRIPTION", amount: data.summary.totalSubscriptions, count: data.summary.subscriptionCount },
    { type: "REDEMPTION", amount: data.summary.totalRedemptions, count: data.summary.redemptionCount },
  ];

  const colors: Record<string, string> = {
    SUBSCRIPTION: "#12B76A",
    REDEMPTION: "#F04438",
  };

  const labels: Record<string, string> = {
    SUBSCRIPTION: "Subscription",
    REDEMPTION: "Redemption",
  };

  const transactionTypeConfig: Record<string, { label: string; color: "success" | "error" | "brand" | "warning"; icon: React.ElementType }> = {
    SUBSCRIPTION: { label: "Subscription", color: "success", icon: ArrowDownLeft },
    REDEMPTION: { label: "Redemption", color: "error", icon: ArrowUpRight },
    SWITCHING_IN: { label: "Switch In", color: "brand", icon: TrendUp01 },
    SWITCHING_OUT: { label: "Switch Out", color: "warning", icon: TrendDown01 },
  };

  return (
    <div className="min-h-screen bg-secondary_subtle">
      {/* Header */}
      <div className="bg-primary border-b border-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-primary">Fund Manager Dashboard</h1>
              <p className="text-tertiary mt-1">Manage funds, monitor performance, and track investments</p>
            </div>
            <Button color="secondary" iconLeading={RefreshCw} onClick={fetchDashboardData}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Funds */}
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-tertiary">Total Funds</h3>
              <div className="p-2 bg-brand-secondary/20 rounded-lg">
                <Building02 className="size-5 text-brand-secondary" />
              </div>
            </div>
            <div>
              <p className="text-display-sm font-semibold text-primary">{data.summary.totalFunds}</p>
              <p className="text-sm text-tertiary">Active funds</p>
            </div>
          </div>

          {/* Total AUM */}
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-tertiary">Total AUM</h3>
              <div className="p-2 bg-success-secondary/20 rounded-lg">
                <DollarLine className="size-5 text-success-primary" />
              </div>
            </div>
            <div>
              <p className="text-display-sm font-semibold text-primary">{formatCurrency(data.summary.totalAUM)}</p>
              <p className="text-sm text-tertiary">Under management</p>
            </div>
          </div>

          {/* Total Investors */}
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-tertiary">Total Investors</h3>
              <div className="p-2 bg-warning-secondary/20 rounded-lg">
                <Users01 className="size-5 text-warning-primary" />
              </div>
            </div>
            <div>
              <p className="text-display-sm font-semibold text-primary">{data.summary.totalInvestors.toLocaleString("id-ID")}</p>
              <p className="text-sm text-tertiary">Across all funds</p>
            </div>
          </div>

          {/* Monthly Fees */}
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-tertiary">Fees Collected</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendUp01 className="size-5 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-display-sm font-semibold text-primary">{formatCurrency(data.summary.totalFeesCollected)}</p>
              <p className="text-sm text-tertiary">This month</p>
            </div>
          </div>
        </div>

        {/* Charts Row - NAV History & Daily Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* NAV History Chart */}
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5">
            <h3 className="text-md font-semibold text-primary mb-4">NAV History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={Object.entries(data.navHistoryByFund).flatMap(([fundId, navs]) =>
                  navs.map((nav) => ({ ...nav, fundId: Number(fundId) }))
                )}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
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
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                        <p className="font-semibold">{fundNames[data.fundId] || `Fund ${data.fundId}`}</p>
                        <p className="text-sm">NAV: {formatValue(data.nav)}</p>
                        <p className="text-sm">Date: {formatDate(data.date)}</p>
                      </div>
                    );
                  }}
                />
                {Object.keys(data.navHistoryByFund).map((fundId) => (
                  <Line
                    key={fundId}
                    type="monotone"
                    dataKey="nav"
                    data={data.navHistoryByFund[Number(fundId)]}
                    name={fundNames[Number(fundId)] || `Fund ${fundId}`}
                    stroke={fundColors[Number(fundId)] || "#7F56D9"}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Transaction Flow */}
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5">
            <h3 className="text-md font-semibold text-primary mb-4">Daily Transaction Flow</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                        <p className="font-semibold">{formatDate(data.date)}</p>
                        <p className="text-sm">Amount: {formatCurrency(data.amount)}</p>
                        <p className="text-sm">Count: {data.count} transactions</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="amount" fill="#7F56D9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fund List Table */}
        <div className="mb-8">
          <TableCard.Root>
            <TableCard.Header
              title="Fund List"
              badge={data.funds.length}
              description="Overview of all managed funds"
            />
            <Table.Root>
              <Table.Header>
                <Table.Head label="Fund" />
                <Table.Head label="NAV" />
                <Table.Head label="YTD Return" />
                <Table.Head label="30D Return" />
                <Table.Head label="Investors" />
                <Table.Head label="AUM" />
                <Table.Head label="Status" />
              </Table.Header>
              <Table.Body>
                {data.funds.map((fund) => (
                  <Table.Row key={fund.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: fund.color || "#7F56D9" }}
                        />
                        <div>
                          <span className="font-medium text-secondary">{fund.name}</span>
                          <span className="text-xs text-tertiary ml-2">({fund.code})</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-medium text-secondary">{formatCurrency(fund.currentNAV)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        {fund.ytdReturn >= 0 ? (
                          <TrendUp01 className="size-4 text-success-primary" />
                        ) : (
                          <TrendDown01 className="size-4 text-error-primary" />
                        )}
                        <span
                          className={cx(
                            "font-medium",
                            fund.ytdReturn >= 0 ? "text-success-primary" : "text-error-primary"
                          )}
                        >
                          {fund.ytdReturn > 0 ? "+" : ""}
                          {fund.ytdReturn}%
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        {fund.return30d >= 0 ? (
                          <TrendUp01 className="size-4 text-success-primary" />
                        ) : (
                          <TrendDown01 className="size-4 text-error-primary" />
                        )}
                        <span
                          className={cx(
                            "font-medium",
                            fund.return30d >= 0 ? "text-success-primary" : "text-error-primary"
                          )}
                        >
                          {fund.return30d > 0 ? "+" : ""}
                          {fund.return30d}%
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-tertiary">{fund.investorCount.toLocaleString("id-ID")}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-medium text-secondary">{formatCurrency(fund.aum)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-1">
                        {fund.isActive && <Badge color="success" size="sm">Active</Badge>}
                        {fund.canSubscribe && <Badge color="brand" size="sm">Subscribe</Badge>}
                        {fund.canRedeem && <Badge color="warning" size="sm">Redeem</Badge>}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </TableCard.Root>
        </div>

        {/* Transaction Volume & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Transaction Volume */}
          <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5">
            <h3 className="text-md font-semibold text-primary mb-4">Monthly Transaction Volume</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={transactionVolumeData.map((d) => ({
                  ...d,
                  name: labels[d.type] || d.type,
                  fill: colors[d.type] || "#7F56D9",
                }))}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
              >
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

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <TableCard.Root>
              <TableCard.Header title="Recent Transactions" badge={data.recentTransactions.length} />
              <Table.Root>
                <Table.Header>
                  <Table.Head label="Type" />
                  <Table.Head label="Investor" />
                  <Table.Head label="Fund" />
                  <Table.Head label="Amount" />
                  <Table.Head label="Units" />
                  <Table.Head label="Date" />
                </Table.Header>
                <Table.Body>
                  {data.recentTransactions.slice(0, 10).map((transaction) => {
                    const config = transactionTypeConfig[transaction.type] || {
                      label: transaction.type,
                      color: "gray",
                      icon: null,
                    };
                    const Icon = config.icon;

                    return (
                      <Table.Row key={transaction.id}>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon
                                className={cx(
                                  "size-4",
                                  transaction.type === "SUBSCRIPTION"
                                    ? "text-success-primary"
                                    : transaction.type === "REDEMPTION"
                                    ? "text-error-primary"
                                    : "text-brand-secondary"
                                )}
                              />
                            )}
                            <Badge color={config.color} size="sm">
                              {config.label}
                            </Badge>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="font-medium text-secondary">{transaction.investorName}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-col">
                            <span className="font-medium text-secondary">{transaction.fundName}</span>
                            <span className="text-xs text-tertiary">{transaction.fundCode}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="font-medium text-secondary">{formatCurrency(transaction.amount)}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-tertiary">
                            {transaction.units.toLocaleString("id-ID", { maximumFractionDigits: 4 })}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-tertiary">
                            {new Date(transaction.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </TableCard.Root>
          </div>
        </div>

        {/* Management Fee Summary */}
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset p-5 mb-8">
          <h3 className="text-md font-semibold text-primary mb-4">Management Fee Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.funds.map((fund) => (
              <div key={fund.id} className="p-4 bg-secondary_subtle rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-secondary">{fund.name}</span>
                  <Badge color="gray" size="sm">
                    {fund.managementFeeRate}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-tertiary">Est. Monthly Fee</span>
                  <span className="font-semibold text-primary">{formatCurrency(fund.estimatedMonthlyFee)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
