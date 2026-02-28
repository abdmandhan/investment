import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma, { TransactionType } from "@investment/urs";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has fund manager role
    const hasAccess = session.user.roles.includes("fund_manager") ||
      session.user.roles.includes("admin") ||
      session.user.permissions.includes("dashboard:fund_manager:view");

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get fund ID from query params (if viewing specific fund)
    const { searchParams } = new URL(request.url);
    const fundIdParam = searchParams.get("fundId");

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get funds under management
    const fundsQuery = fundIdParam
      ? { id: parseInt(fundIdParam), is_active: true }
      : { is_active: true };

    const funds = await prisma.funds.findMany({
      where: fundsQuery,
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
        management_fee_rate: true,
        valuation_basis: true,
        initial_nav: true,
        initial_nav_per_unit: true,
        is_active: true,
        can_subscript: true,
        can_redeem: true,
        can_switch: true,
        _count: {
          select: {
            investor_accounts: true
          }
        }
      }
    });

    const fundIds = funds.map(f => f.id);

    // Get AUM per fund
    const aumPerFund = await prisma.aum_investor_daily.groupBy({
      by: ["fund_id"],
      where: {
        fund_id: { in: fundIds },
        date: { gte: thirtyDaysAgo }
      },
      _sum: { aum_value: true }
    });

    // Get latest NAV for each fund
    const latestNAVs = await Promise.all(
      fundIds.map(fundId =>
        prisma.fund_navs.findFirst({
          where: { fund_id: fundId },
          orderBy: { date: "desc" },
          select: { fund_id: true, nav: true, nav_per_unit: true, outstanding_unit: true, date: true }
        })
      )
    );

    // NAV history for each fund (last 90 days)
    const navHistory = await prisma.fund_navs.findMany({
      where: {
        fund_id: { in: fundIds },
        date: { gte: ninetyDaysAgo }
      },
      orderBy: { date: "asc" },
      select: { fund_id: true, date: true, nav_per_unit: true, nav: true, outstanding_unit: true }
    });

    // Group NAV history by fund
    const navHistoryByFund = navHistory.reduce((acc, nav) => {
      if (!acc[nav.fund_id]) acc[nav.fund_id] = [];
      acc[nav.fund_id].push({
        date: nav.date.toISOString().split('T')[0],
        nav: Number(nav.nav_per_unit),
        totalNav: Number(nav.nav),
        outstandingUnits: Number(nav.outstanding_unit)
      });
      return acc;
    }, {} as Record<number, { date: string; nav: number; totalNav: number; outstandingUnits: number }[]>);

    // Calculate fund metrics
    const fundMetrics = funds.map(fund => {
      const aum = aumPerFund.find(a => a.fund_id === fund.id)?._sum.aum_value || 0;
      const latestNAV = latestNAVs.find(n => n?.fund_id === fund.id);
      const history = navHistoryByFund[fund.id] || [];

      // Calculate performance
      const currentNAV = latestNAV?.nav_per_unit || fund.initial_nav_per_unit;
      const initialNAV = fund.initial_nav_per_unit;
      const ytdReturn = initialNAV > 0
        ? Number(((Number(currentNAV) - Number(initialNAV)) / Number(initialNAV) * 100).toFixed(2))
        : 0;

      // Calculate 30-day return
      const nav30DaysAgo = history.length > 0 ? history[0].nav : Number(currentNAV);
      const return30d = nav30DaysAgo > 0
        ? Number(((Number(currentNAV) - nav30DaysAgo) / nav30DaysAgo * 100).toFixed(2))
        : 0;

      // Calculate management fee for current month
      const managementFee = Number(aum) * (Number(fund.management_fee_rate) / 100) / Number(fund.valuation_basis) * 30;

      return {
        id: fund.id,
        name: fund.name,
        code: fund.code,
        color: fund.color,
        aum: Number(aum),
        investorCount: fund._count.investor_accounts,
        currentNAV: Number(currentNAV),
        outstandingUnits: Number(latestNAV?.outstanding_unit || 0),
        totalNAV: Number(latestNAV?.nav || 0),
        ytdReturn,
        return30d,
        managementFeeRate: Number(fund.management_fee_rate),
        estimatedMonthlyFee: Number(managementFee.toFixed(2)),
        isActive: fund.is_active,
        canSubscribe: fund.can_subscript,
        canRedeem: fund.can_redeem,
        canSwitch: fund.can_switch
      };
    });

    // Subscription/Redemption flow this month
    const [subscriptions, redemptions] = await Promise.all([
      prisma.transactions.aggregate({
        where: {
          fund_id: { in: fundIds },
          transaction_type: TransactionType.SUBSCRIPTION,
          transaction_date: { gte: startOfMonth }
        },
        _sum: { amount: true, units: true },
        _count: { id: true }
      }),
      prisma.transactions.aggregate({
        where: {
          fund_id: { in: fundIds },
          transaction_type: TransactionType.REDEMPTION,
          transaction_date: { gte: startOfMonth }
        },
        _sum: { amount: true, units: true },
        _count: { id: true }
      })
    ]);

    // Daily transaction flow
    const dailyFlow = await prisma.transactions.groupBy({
      by: ["transaction_date"],
      where: {
        fund_id: { in: fundIds },
        transaction_type: { in: [TransactionType.SUBSCRIPTION, TransactionType.REDEMPTION] },
        transaction_date: { gte: thirtyDaysAgo }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const formattedDailyFlow = dailyFlow.map(day => ({
      date: day.transaction_date.toISOString().split('T')[0],
      amount: Number(day._sum.amount || 0),
      count: day._count.id
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Recent transactions across managed funds
    const recentTransactions = await prisma.transactions.findMany({
      where: { fund_id: { in: fundIds } },
      take: 15,
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

    // Calculate total management fees collected this month
    const totalFeesCollected = await prisma.aum_investor_daily.aggregate({
      where: {
        fund_id: { in: fundIds },
        date: { gte: startOfMonth }
      },
      _sum: { management_fee: true }
    });

    // Fund performance comparison
    const fundPerformance = fundMetrics.map(fund => ({
      fundId: fund.id,
      fundName: fund.name,
      fundCode: fund.code,
      color: fund.color,
      ytdReturn: fund.ytdReturn,
      return30d: fund.return30d,
      aum: fund.aum
    })).sort((a, b) => b.ytdReturn - a.ytdReturn);

    return NextResponse.json({
      funds: fundMetrics,
      summary: {
        totalFunds: funds.length,
        totalAUM: fundMetrics.reduce((sum, f) => sum + f.aum, 0),
        totalInvestors: fundMetrics.reduce((sum, f) => sum + f.investorCount, 0),
        totalSubscriptions: Number(subscriptions._sum.amount || 0),
        totalRedemptions: Number(redemptions._sum.amount || 0),
        netFlow: Number(subscriptions._sum.amount || 0) - Number(redemptions._sum.amount || 0),
        subscriptionCount: subscriptions._count.id,
        redemptionCount: redemptions._count.id,
        totalFeesCollected: Number(totalFeesCollected._sum.management_fee || 0)
      },
      navHistoryByFund,
      dailyFlow: formattedDailyFlow,
      recentTransactions: formattedTransactions,
      fundPerformance
    });
  } catch (error) {
    console.error("Fund manager dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund manager dashboard data" },
      { status: 500 }
    );
  }
}
