import { Prisma } from "@investment/urs";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import type { Context } from "../trpc";
import type { Prisma as PrismaTypes } from "@investment/urs";

type LatestHolding = { investor_id: string; fund_id: number; units_after: unknown };
type LatestNav = { fund_id: number; nav_per_unit: unknown };

function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "object" && v !== null && "toNumber" in v && typeof (v as { toNumber(): number }).toNumber === "function") {
    return (v as { toNumber(): number }).toNumber();
  }
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

const formatAum = (aum: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currency: "IDR",
    // notation: "compact",
    style: "currency",
  }).format(aum);
};

async function computeAumByInvestor(
  prisma: Context["prisma"],
  investorIds: string[]
): Promise<Record<string, number>> {
  const aumByInvestor: Record<string, number> = {};
  if (investorIds.length === 0) return aumByInvestor;

  const latestHoldings = await prisma.$queryRaw<LatestHolding[]>`
    SELECT DISTINCT ON (investor_id, fund_id) investor_id, fund_id, units_after
    FROM investor_holdings
    WHERE investor_id IN (${Prisma.join(investorIds)})
    ORDER BY investor_id, fund_id, created_at DESC
  `;

  const fundIds = [...new Set(latestHoldings.map((h) => h.fund_id))];
  const latestNavs =
    fundIds.length > 0
      ? await prisma.$queryRaw<LatestNav[]>`
          SELECT DISTINCT ON (fund_id) fund_id, nav_per_unit
          FROM fund_navs
          WHERE fund_id IN (${Prisma.join(fundIds)})
          ORDER BY fund_id, date DESC
        `
      : [];

  const navByFund = new Map(latestNavs.map((n) => [n.fund_id, n.nav_per_unit]));
  for (const h of latestHoldings) {
    const navPerUnit = toNum(navByFund.get(h.fund_id));
    const units = toNum(h.units_after);
    const aum = units * navPerUnit;
    aumByInvestor[h.investor_id] = (aumByInvestor[h.investor_id] ?? 0) + aum;
  }
  return aumByInvestor;
}

export const investorsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).optional().default(1),
          limit: z.number().min(1).max(100).optional().default(10),
          searchs: z.array(z.object({ key: z.string(), value: z.string().optional() })).optional(),
          sort: z.string().optional(),
          sort_by: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const skip = (page - 1) * limit;
      const sort = input?.sort ?? "created_at";
      const sort_by = input?.sort_by ?? "desc";
      const sortByAum = sort === "aum";

      let where: PrismaTypes.investorsWhereInput = {};

      if (input?.searchs) {
        for (const search of input.searchs) {
          if (search.value) {
            // @ts-expect-error dynamic key from search
            where[search.key] = { contains: search.value, mode: "insensitive" };
          }
        }
      }

      const total = await ctx.prisma.investors.count({ where });

      let items: Awaited<ReturnType<typeof ctx.prisma.investors.findMany>>;

      if (sortByAum) {
        const allIds = await ctx.prisma.investors.findMany({ where, select: { id: true } });
        const investorIds = allIds.map((i) => i.id);
        const aumByInvestor = await computeAumByInvestor(ctx.prisma, investorIds);
        const sortedIds = [...investorIds].sort((a, b) => {
          const aumA = aumByInvestor[a] ?? 0;
          const aumB = aumByInvestor[b] ?? 0;
          if (sort_by === "desc") return aumB - aumA;
          return aumA - aumB;
        });
        const pageIds = sortedIds.slice(skip, skip + limit);
        const rows = await ctx.prisma.investors.findMany({
          where: { id: { in: pageIds } },
        });
        const orderMap = new Map(pageIds.map((id, i) => [id, i]));
        items = rows.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      } else {
        items = await ctx.prisma.investors.findMany({
          take: limit,
          skip,
          orderBy: { [sort]: sort_by },
          where,
        });
      }

      const investorIds = items.map((i) => i.id);
      const aumByInvestor =
        investorIds.length > 0 ? await computeAumByInvestor(ctx.prisma, investorIds) : {};

      return {
        items: items.map((row) => ({
          id: row.id,
          name: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" "),
          email: row.email ?? undefined,
          phone_number: row.phone_number ?? undefined,
          investor_type_id: row.investor_type_id,
          sid: row.sid,
          aum: formatAum(aumByInvestor[row.id] ?? 0),
        })),
        total,
        page,
        limit,
      };
    }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const investor = await ctx.prisma.investors.findUnique({ where: { id: input.id } });
      return investor;
    }),
  portfolio: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // get last holdings for an investor
      const portfolio = await ctx.prisma.investor_holdings.findMany({
        where: { investor_id: input.id },
        orderBy: { created_at: "desc" },
        distinct: ["fund_id"],
        select: {
          fund_id: true,
          units_after: true,
        }
      });

      const fundIds = portfolio.map((p) => p.fund_id);
      const funds = await ctx.prisma.funds.findMany({
        where: { id: { in: fundIds } }, select: {
          id: true,
          name: true,
          code: true,
          fund_navs: {
            orderBy: { date: "desc" },
            take: 1,
            select: { nav_per_unit: true, date: true }
          }
        },
      });
      const fundMap = new Map(funds.map((f) => [f.id, f]));
      return portfolio.map((p) => ({
        fund_id: p.fund_id,
        units_after: p.units_after,
        fund: fundMap.get(p.fund_id),
      }));
    }),
});
