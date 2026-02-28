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

    // Check if user has sales role or agent access
    const hasAccess = session.user.roles.includes("sales") || 
                      session.user.roles.includes("agent") ||
                      session.user.roles.includes("admin") ||
                      session.user.permissions.includes("dashboard:sales:view");

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get agent ID from user (assuming user is linked to an agent)
    // For now, we'll query by agent code or name matching username
    const agent = await prisma.agents.findFirst({
      where: {
        OR: [
          { email: session.user.email || "" },
          { name: { contains: session.user.name || "" } }
        ],
        is_active: true
      },
      select: { id: true, code: true, name: true, agent_level_id: true }
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    }

    const agentId = agent.id;

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get investors managed by this agent
    const agentInvestorIds = await prisma.agent_investors.findMany({
      where: { agent_id: agentId },
      select: { investor_id: true }
    });

    const investorIds = agentInvestorIds.map(ai => ai.investor_id);

    // Personal AUM (total of their investors)
    const aumData = await prisma.aum_investor_daily.findMany({
      where: {
        agent_id: agentId,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: "desc" },
      select: { aum_value: true, date: true }
    });

    const latestAUM = aumData.length > 0 ? aumData[0].aum_value : 0;
    const previousAUM = aumData.length > 1 ? aumData[aumData.length - 1].aum_value : latestAUM;
    const aumChange = previousAUM > 0 
      ? Number(((Number(latestAUM) - Number(previousAUM)) / Number(previousAUM) * 100).toFixed(2))
      : 0;

    // AUM trend over time
    const aumTrend = aumData.reduce((acc, curr) => {
      const dateStr = curr.date.toISOString().split('T')[0];
      const existing = acc.find(a => a.date === dateStr);
      if (existing) {
        existing.value += Number(curr.aum_value);
      } else {
        acc.push({ date: dateStr, value: Number(curr.aum_value) });
      }
      return acc;
    }, [] as { date: string; value: number }[]);

    // Number of investors managed
    const totalInvestors = investorIds.length;

    // New investors this month
    const newInvestorsThisMonth = await prisma.agent_investors.count({
      where: {
        agent_id: agentId,
        effective_date: { gte: startOfMonth }
      }
    });

    const newInvestorsLastMonth = await prisma.agent_investors.count({
      where: {
        agent_id: agentId,
        effective_date: { gte: startOfLastMonth, lt: startOfMonth }
      }
    });

    // Monthly sales target vs actual (assuming a default target of 1 billion IDR)
    const monthlyTarget = 1000000000; // 1 billion IDR - should come from config/DB
    const currentMonthSales = await prisma.transactions.aggregate({
      where: {
        agent_id: agentId,
        transaction_type: TransactionType.SUBSCRIPTION,
        transaction_date: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    const actualSales = Number(currentMonthSales._sum.amount || 0);
    const salesTargetProgress = monthlyTarget > 0 ? Math.min((actualSales / monthlyTarget) * 100, 100) : 0;

    // Last month sales for comparison
    const lastMonthSales = await prisma.transactions.aggregate({
      where: {
        agent_id: agentId,
        transaction_type: TransactionType.SUBSCRIPTION,
        transaction_date: { gte: startOfLastMonth, lte: endOfLastMonth }
      },
      _sum: { amount: true }
    });

    const lastMonthSalesValue = Number(lastMonthSales._sum.amount || 0);
    const salesGrowth = lastMonthSalesValue > 0 
      ? Number(((actualSales - lastMonthSalesValue) / lastMonthSalesValue * 100).toFixed(2))
      : 0;

    // Recent transactions from their investors
    const recentTransactions = await prisma.transactions.findMany({
      where: { agent_id: agentId },
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

    // Top investors by AUM
    const topInvestors = await prisma.aum_investor_daily.findMany({
      where: {
        agent_id: agentId,
        date: { gte: thirtyDaysAgo }
      },
      select: {
        investor_id: true,
        aum_value: true,
        investor: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: { aum_value: "desc" },
      take: 50 // Get more to aggregate
    });

    // Aggregate AUM by investor
    const investorAUMMap = new Map();
    topInvestors.forEach(aum => {
      const existing = investorAUMMap.get(aum.investor_id);
      if (!existing || aum.aum_value > existing.aum_value) {
        investorAUMMap.set(aum.investor_id, {
          id: aum.investor_id,
          name: `${aum.investor.first_name} ${aum.investor.last_name || ''}`.trim(),
          email: aum.investor.email,
          aum: Number(aum.aum_value)
        });
      }
    });

    const topInvestorsByAUM = Array.from(investorAUMMap.values())
      .sort((a, b) => b.aum - a.aum)
      .slice(0, 5);

    // Commission/Overview metrics (placeholder - would need commission table)
    const estimatedCommission = actualSales * 0.01; // 1% commission rate

    // Investor acquisition trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const acquisitionData = await prisma.agent_investors.findMany({
      where: {
        agent_id: agentId,
        effective_date: { gte: sixMonthsAgo }
      },
      select: { effective_date: true },
      orderBy: { effective_date: "asc" }
    });

    // Group by month
    const acquisitionTrend = acquisitionData.reduce((acc, curr) => {
      const monthKey = curr.effective_date.toISOString().slice(0, 7); // YYYY-MM
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const formattedAcquisitionTrend = Object.entries(acquisitionTrend).map(([month, count]) => ({
      month,
      count
    }));

    // Transaction volume by type this month
    const transactionVolumeByType = await prisma.transactions.groupBy({
      by: ["transaction_type"],
      where: {
        agent_id: agentId,
        transaction_date: { gte: startOfMonth }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    return NextResponse.json({
      agent: {
        id: agentId,
        code: agent.code,
        name: agent.name
      },
      metrics: {
        personalAUM: Number(latestAUM),
        aumChange,
        totalInvestors,
        newInvestorsThisMonth,
        newInvestorsLastMonth,
        monthlyTarget,
        actualSales,
        salesTargetProgress: Number(salesTargetProgress.toFixed(2)),
        salesGrowth,
        estimatedCommission: Number(estimatedCommission.toFixed(2)),
        transactionCount: formattedTransactions.length
      },
      aumTrend,
      recentTransactions: formattedTransactions,
      topInvestors: topInvestorsByAUM,
      acquisitionTrend: formattedAcquisitionTrend,
      transactionVolumeByType: transactionVolumeByType.map(tv => ({
        type: tv.transaction_type,
        amount: Number(tv._sum.amount || 0),
        count: tv._count.id
      }))
    });
  } catch (error) {
    console.error("Sales dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales dashboard data" },
      { status: 500 }
    );
  }
}
