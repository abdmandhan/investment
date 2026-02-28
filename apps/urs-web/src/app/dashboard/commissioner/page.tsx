"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AUMCard,
  InvestorCountCard,
  FundCountCard,
  AgentCountCard,
  AUMTrendChart,
  FundPerformanceChart,
  TransactionVolumeChart,
  TransactionsTable,
  ActivityFeed,
  FundPerformanceTable,
  AgentRankingTable,
} from "@/components/dashboard";
import { Button } from "@/components/base/buttons/button";
import { AlertTriangle, RefreshCw01 } from "@untitledui/icons";

interface CommissionerDashboardData {
  metrics: {
    totalAUM: number;
    aumChange: number;
    totalInvestors: number;
    totalFunds: number;
    totalAgents: number;
    currentMonthSubscriptions: number;
    currentMonthRedemptions: number;
    subscriptionCount: number;
    redemptionCount: number;
    lastMonthSubscriptions: number;
    lastMonthRedemptions: number;
    pendingApprovals: number;
  };
  aumHistory: { date: string; value: number }[];
  topPerformingFunds: Array<{
    id: number;
    name: string;
    code: string;
    color: string | null;
    currentNAV: number;
    performance: number;
    trend: "positive" | "negative";
  }>;
  navHistoryByFund: Record<number, { date: string; nav: number }[]>;
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
  agentRanking: Array<{
    id: number;
    code: string;
    name: string;
    level: string;
    totalAUM: number;
  }>;
}

export default function CommissionerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CommissionerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check for commissioner role
    if (status === "authenticated") {
      const hasAccess = session?.user?.roles?.includes("commissioner") ||
        session?.user?.roles?.includes("admin") ||
        session?.user?.permissions?.includes("dashboard:commissioner:view");

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

      const response = await fetch("/api/dashboard/commissioner");

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
        <RefreshCw01 className="size-8 text-brand-secondary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="size-12 text-error-primary" />
        <p className="text-error-primary">{error}</p>
        <Button onClick={fetchDashboardData} iconLeading={RefreshCw01}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  // Prepare fund colors and names for chart
  const fundColors = data.topPerformingFunds.reduce((acc, fund) => {
    acc[fund.id] = fund.color || "#7F56D9";
    return acc;
  }, {} as Record<number, string>);

  const fundNames = data.topPerformingFunds.reduce((acc, fund) => {
    acc[fund.id] = fund.code;
    return acc;
  }, {} as Record<number, string>);

  // Prepare transaction volume data
  const transactionVolumeData = [
    { type: "SUBSCRIPTION", amount: data.metrics.currentMonthSubscriptions, count: data.metrics.subscriptionCount },
    { type: "REDEMPTION", amount: data.metrics.currentMonthRedemptions, count: data.metrics.redemptionCount },
  ];

  // Generate activity feed from recent transactions
  const activities = data.recentTransactions.slice(0, 10).map(tx => ({
    id: tx.id,
    type: tx.type === 'SUBSCRIPTION' ? 'transaction' : tx.type === 'REDEMPTION' ? 'transaction' : 'system' as const,
    title: `${tx.type === 'SUBSCRIPTION' ? 'New subscription' : 'Redemption'} - ${tx.fundCode}`,
    description: `${tx.investorName} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(tx.amount)}`,
    timestamp: tx.date,
    status: tx.type === 'SUBSCRIPTION' ? 'success' as const : 'info' as const,
    metadata: { Units: tx.units.toFixed(4) }
  }));

  return (
    <div className="min-h-screen bg-secondary_subtle">
      {/* Header */}
      <div className="bg-primary border-b border-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-primary">Commissioner Dashboard</h1>
              <p className="text-tertiary mt-1">Executive overview of all investment activities</p>
            </div>
            <Button color="secondary" iconLeading={RefreshCw01} onClick={fetchDashboardData}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AUMCard
            value={data.metrics.totalAUM}
            change={data.metrics.aumChange}
            loading={loading}
          />
          <InvestorCountCard
            value={data.metrics.totalInvestors}
            loading={loading}
          />
          <FundCountCard
            value={data.metrics.totalFunds}
            loading={loading}
          />
          <AgentCountCard
            value={data.metrics.totalAgents}
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AUMTrendChart
              data={data.aumHistory}
              height={350}
            />
          </div>
          <div>
            <TransactionVolumeChart
              data={transactionVolumeData}
              height={350}
            />
          </div>
        </div>

        {/* Fund Performance Chart */}
        <div className="mb-8">
          <FundPerformanceChart
            data={data.navHistoryByFund}
            fundColors={fundColors}
            fundNames={fundNames}
            height={350}
          />
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FundPerformanceTable
            funds={data.topPerformingFunds.map(f => ({ ...f, aum: 0, investorCount: 0 }))}
            loading={loading}
            maxRows={5}
          />
          <AgentRankingTable
            agents={data.agentRanking}
            loading={loading}
            maxRows={5}
          />
        </div>

        {/* Activity and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionsTable
              transactions={data.recentTransactions}
              title="Recent Transactions"
              showInvestor={true}
              showFund={true}
              loading={loading}
              maxRows={10}
            />
          </div>
          <div>
            <ActivityFeed
              activities={activities}
              title="Recent Activity"
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
