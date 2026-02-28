import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@investment/urs";
import { TransactionType } from "@prisma/generated/urs";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has commissioner role or admin permissions
    const hasAccess = session.user.roles.includes("commissioner") || 
                      session.user.roles.includes("admin") ||
                      session.user.permissions.includes("dashboard:commissioner:view");

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current date and date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch Total AUM with trend
    const [currentAUM, previousAUM] = await Promise.all([
      prisma.aum_daily.findFirst({
        orderBy: { date: "desc" },
        select: { aum_value: true, date: true }
      }),
      prisma.aum_daily.findFirst({
        where: { date: { lt: thirtyDaysAgo } },
        orderBy: { date: "desc" },
        select: { aum_value: true }
      })
    ]);

    const totalAUM = currentAUM?.aum_value || 0;
    const previousAUMValue = previousAUM?.aum_value || totalAUM;
    const aumChange = totalAUM > 0 && previousAUMValue > 0 
      ? Number(((Number(totalAUM) - Number(previousAUMValue)) / Number(previousAUMValue) * 100).toFixed(2))
      : 0;

    // Fetch AUM history for chart (last 30 days)
    const aumHistory = await prisma.aum_daily.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
      select: { date: true, aum_value: true }
    });

    // Count totals
    const [totalInvestors, totalFunds, totalAgents] = await Promise.all([
      prisma.investors.count(),
      prisma.funds.count({ where: { is_active: true } }),
      prisma.agents.count({ where: { is_active: true } })
    ]);

    // Monthly transaction volume
    const [currentMonthSubscriptions, currentMonthRedemptions, lastMonthSubscriptions, lastMonthRedemptions] = await Promise.all([
      prisma.transactions.aggregate({
        where: {
          transaction_type: TransactionType.SUBSCRIPTION,
          transaction_date: { gte: startOfMonth }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.transactions.aggregate({
        where: {
          transaction_type: TransactionType.REDEMPTION,
          transaction_date: { gte: startOfMonth }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.transactions.aggregate({
        where: {
          transaction_type: TransactionType.SUBSCRIPTION,
          transaction_date: { gte: startOfLastMonth, lte: endOfLastMonth }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.transactions.aggregate({
        where: {
          transaction_type: TransactionType.REDEMPTION,
          transaction_date: { gte: startOfLastMonth, lte: endOfLastMonth }
        },
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    // Top performing funds
    const topFunds = await prisma.funds.findMany({
      where: { is_active: true },
      take: 5,
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
        fund_navs: {
          orderBy: { date: "desc" },
          take: 2,
          select: { nav_per_unit: true, date: true }
        }
      }
    });

    const topPerformingFunds = topFunds.map(fund => {
      const currentNAV = fund.fund_navs[0]?.nav_per_unit || 0;
      const previousNAV = fund.fund_navs[1]?.nav_per_unit || currentNAV;
      const performance = previousNAV > 0 
        ? Number(((Number(currentNAV) - Number(previousNAV)) / Number(previousNAV) * 100).toFixed(2))
        : 0;
      
      return {
        id: fund.id,
        name: fund.name,
        code: fund.code,
        color: fund.color,
        currentNAV: Number(currentNAV),
        performance,
        trend: performance >= 0 ? "positive" : "negative" as const
      };
    }).sort((a, b) => b.performance - a.performance);

    // Fund NAV history for chart (top 5 funds)
    const fundIdsForChart = topPerformingFunds.slice(0, 5).map(f => f.id);
    const fundNAVHistory = await prisma.fund_navs.findMany({
      where: {
        fund_id: { in: fundIdsForChart },
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: "asc" },
      select: { fund_id: true, date: true, nav_per_unit: true }
    });

    // Group NAV history by fund
    const navHistoryByFund = fundNAVHistory.reduce((acc, nav) => {
      if (!acc[nav.fund_id]) acc[nav.fund_id] = [];
      acc[nav.fund_id].push({
        date: nav.date.toISOString().split('T')[0],
        nav: Number(nav.nav_per_unit)
      });
      return acc;
    }, {} as Record<number, { date: string; nav: number }[]>);

    // Recent transactions
    const recentTransactions = await prisma.transactions.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        transaction_type: true,
        amount: true,
        units: true,
        transaction_date: true,
        investor: { select: { first_name: true, last_name: true } },
        fund: { select: { name: true, code: true } }
      }
    });

    const formattedTransactions = recentTransactions.map(tx => ({
      id: tx.id,
      type: tx.transaction_type,
      amount: Number(tx.amount),
      units: Number(tx.units),
      date: tx.transaction_date.toISOString(),
      investorName: `${tx.investor.first_name} ${tx.investor.last_name || ''}`.trim(),
      fundName: tx.fund.name,
      fundCode: tx.fund.code
    }));

    // Pending approvals from journals
    const pendingApprovals = await prisma.journals.count({
      where: { status: "PENDING" }
    });

    // Agent performance ranking
    const agentPerformance = await prisma.agents.findMany({
      where: { is_active: true },
      take: 10,
      select: {
        id: true,
        code: true,
        name: true,
        agent_level: { select: { name: true } },
        aum_investor_daily: {
          where: { date: { gte: thirtyDaysAgo } },
          select: { aum_value: true }
        }
      }
    });

    const rankedAgents = agentPerformance
      .map(agent => ({
        id: agent.id,
        code: agent.code,
        name: agent.name,
        level: agent.agent_level.name,
        totalAUM: agent.aum_investor_daily.reduce((sum, aum) => sum + Number(aum.aum_value), 0)
      }))
      .sort((a, b) => b.totalAUM - a.totalAUM)
      .slice(0, 5);

    return NextResponse.json({
      metrics: {
        totalAUM: Number(totalAUM),
        aumChange,
        totalInvestors,
        totalFunds,
        totalAgents,
        currentMonthSubscriptions: Number(currentMonthSubscriptions._sum.amount || 0),
        currentMonthRedemptions: Number(currentMonthRedemptions._sum.amount || 0),
        subscriptionCount: currentMonthSubscriptions._count.id,
        redemptionCount: currentMonthRedemptions._count.id,
        lastMonthSubscriptions: Number(lastMonthSubscriptions._sum.amount || 0),
        lastMonthRedemptions: Number(lastMonthRedemptions._sum.amount || 0),
        pendingApprovals
      },
      aumHistory: aumHistory.map(aum => ({
        date: aum.date.toISOString().split('T')[0],
        value: Number(aum.aum_value)
      })),
      topPerformingFunds,
      navHistoryByFund,
      recentTransactions: formattedTransactions,
      agentRanking: rankedAgents
    });
  } catch (error) {
    console.error("Commissioner dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
