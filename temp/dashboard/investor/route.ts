import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@investment/urs";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has investor role
    const hasAccess = session.user.roles.includes("investor") ||
      session.user.roles.includes("admin") ||
      session.user.permissions.includes("dashboard:investor:view");

    // if (!hasAccess) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    // Get investor ID from user (assuming user is linked to an investor)
    const investor = await prisma.investors.findFirst({
      where: {
        OR: [
          { email: session.user.email || "" },
          { external_code: session.user.username || "" }
        ]
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        risk_level: { select: { name: true } }
      }
    });

    if (!investor) {
      return NextResponse.json({ error: "Investor profile not found" }, { status: 404 });
    }

    const investorId = investor.id;

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get current holdings with fund details
    const holdings = await prisma.investor_holdings.findMany({
      where: { investor_id: investorId },
      orderBy: { created_at: "desc" },
      distinct: ["fund_id"],
      select: {
        units_after: true,
        fund_id: true,
        fund: {
          select: {
            name: true,
            code: true,
            color: true,
            fund_navs: {
              orderBy: { date: "desc" },
              take: 1,
              select: { nav_per_unit: true, date: true }
            }
          }
        }
      }
    });

    // Calculate portfolio value and total units
    let totalPortfolioValue = 0;
    let totalUnits = 0;
    const portfolioHoldings = holdings.map(holding => {
      const currentNAV = holding.fund.fund_navs[0]?.nav_per_unit || 0;
      const units = Number(holding.units_after);
      const value = units * Number(currentNAV);

      totalPortfolioValue += value;
      totalUnits += units;

      return {
        fundId: holding.fund_id,
        fundName: holding.fund.name,
        fundCode: holding.fund.code,
        color: holding.fund.color,
        units: units,
        navPerUnit: Number(currentNAV),
        value: value,
        navDate: holding.fund.fund_navs[0]?.date?.toISOString()
      };
    });

    // Get historical AUM for performance chart
    const aumHistory = await prisma.aum_investor_daily.findMany({
      where: {
        investor_id: investorId,
        date: { gte: oneYearAgo }
      },
      orderBy: { date: "asc" },
      select: { date: true, aum_value: true }
    });

    // Aggregate AUM by date
    const performanceData = aumHistory.reduce((acc, curr) => {
      const dateStr = curr.date.toISOString().split('T')[0];
      const existing = acc.find(a => a.date === dateStr);
      if (existing) {
        existing.value += Number(curr.aum_value);
      } else {
        acc.push({ date: dateStr, value: Number(curr.aum_value) });
      }
      return acc;
    }, [] as { date: string; value: number }[]);

    // Calculate performance metrics
    const currentValue = totalPortfolioValue;
    const initialValue = performanceData.length > 0 ? performanceData[0].value : currentValue;
    const totalReturn = initialValue > 0
      ? Number(((currentValue - initialValue) / initialValue * 100).toFixed(2))
      : 0;

    // Recent transactions
    const recentTransactions = await prisma.transactions.findMany({
      where: { investor_id: investorId },
      take: 10,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        transaction_type: true,
        amount: true,
        units: true,
        transaction_date: true,
        nav_per_unit: true,
        fee: true,
        fund: { select: { name: true, code: true } }
      }
    });

    const formattedTransactions = recentTransactions.map(tx => ({
      id: tx.id,
      type: tx.transaction_type,
      amount: Number(tx.amount),
      units: Number(tx.units),
      navPerUnit: Number(tx.nav_per_unit),
      fee: Number(tx.fee),
      date: tx.transaction_date.toISOString(),
      fundName: tx.fund.name,
      fundCode: tx.fund.code
    }));

    // Portfolio allocation by fund
    const allocation = portfolioHoldings.map(holding => ({
      fundId: holding.fundId,
      fundName: holding.fundName,
      fundCode: holding.fundCode,
      color: holding.color,
      value: holding.value,
      percentage: totalPortfolioValue > 0
        ? Number(((holding.value / totalPortfolioValue) * 100).toFixed(2))
        : 0
    })).sort((a, b) => b.value - a.value);

    // Get all funds available for investment
    const availableFunds = await prisma.funds.findMany({
      where: {
        is_active: true,
        is_public: true,
        can_subscript: true
      },
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

    const formattedAvailableFunds = availableFunds.map(fund => {
      const currentNAV = fund.fund_navs[0]?.nav_per_unit || 0;
      const previousNAV = fund.fund_navs[1]?.nav_per_unit || currentNAV;
      const navChange = previousNAV > 0
        ? Number(((Number(currentNAV) - Number(previousNAV)) / Number(previousNAV) * 100).toFixed(2))
        : 0;

      return {
        id: fund.id,
        name: fund.name,
        code: fund.code,
        color: fund.color,
        currentNAV: Number(currentNAV),
        navChange,
        trend: navChange >= 0 ? "positive" : "negative" as const
      };
    });

    // Calculate monthly performance
    const monthlyPerformance = await calculateMonthlyPerformance(investorId, now);

    // Get statement availability (last 12 months)
    const statements = generateStatementList(now);

    return NextResponse.json({
      investor: {
        id: investorId,
        name: `${investor.first_name} ${investor.last_name || ''}`.trim(),
        email: investor.email,
        riskProfile: investor.risk_level?.name || "Not Set"
      },
      portfolio: {
        totalValue: currentValue,
        totalUnits,
        totalReturn,
        holdings: portfolioHoldings,
        allocation
      },
      performance: {
        history: performanceData,
        monthly: monthlyPerformance
      },
      recentTransactions: formattedTransactions,
      availableFunds: formattedAvailableFunds,
      statements
    });
  } catch (error) {
    console.error("Investor dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch investor dashboard data" },
      { status: 500 }
    );
  }
}

async function calculateMonthlyPerformance(investorId: string, now: Date) {
  const months = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthData = await prisma.aum_investor_daily.findMany({
      where: {
        investor_id: investorId,
        date: { gte: monthStart, lte: monthEnd }
      },
      select: { aum_value: true },
      orderBy: { date: "desc" },
      take: 1
    });

    const startData = await prisma.aum_investor_daily.findMany({
      where: {
        investor_id: investorId,
        date: { gte: monthStart, lte: monthEnd }
      },
      select: { aum_value: true },
      orderBy: { date: "asc" },
      take: 1
    });

    const endValue = monthData[0]?.aum_value || 0;
    const startValue = startData[0]?.aum_value || endValue;

    const return_pct = startValue > 0
      ? Number(((Number(endValue) - Number(startValue)) / Number(startValue) * 100).toFixed(2))
      : 0;

    months.push({
      month: monthStart.toISOString().slice(0, 7),
      monthName: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
      value: Number(endValue),
      return: return_pct
    });
  }

  return months.reverse();
}

function generateStatementList(now: Date) {
  const statements = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    statements.push({
      id: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
      year: date.getFullYear(),
      monthNumber: date.getMonth() + 1,
      available: true
    });
  }
  return statements;
}
