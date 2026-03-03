import { Prisma } from "@investment/urs";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import type { Context } from "../trpc";
import type { Prisma as PrismaTypes } from "@investment/urs";

type LatestAumRow = { investor_id: string; aum_value: unknown };

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

  // Use precomputed daily AUM snapshot instead of recomputing
  // from holdings + NAV on every request.
  const rows = await prisma.$queryRaw<LatestAumRow[]>`
    SELECT investor_id, SUM(aum_value) AS aum_value
    FROM aum_investor_daily
    WHERE investor_id IN (${Prisma.join(investorIds)})
      AND date = (SELECT MAX(date) FROM aum_investor_daily)
    GROUP BY investor_id
  `;

  for (const row of rows) {
    aumByInvestor[row.investor_id] = toNum(row.aum_value);
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
  updateProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
        data: z
          .object({
            external_code: z.string().nullable().optional(),
            first_name: z.string().optional(),
            middle_name: z.string().nullable().optional(),
            last_name: z.string().nullable().optional(),
            email: z.string().email().nullable().optional(),
            phone_number: z.string().nullable().optional(),
            risk_level_id: z.number().int().nullable().optional(),
            risk_point: z.number().int().nullable().optional(),
            sid: z.string().nullable().optional(),
            investor_type_id: z.string().optional(),
          })
          .partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.prisma.investors.findUnique({
        where: { id: input.id },
      });

      if (!current) {
        throw new Error("Investor not found");
      }

      const fields: (keyof typeof input.data)[] = [
        "external_code",
        "first_name",
        "middle_name",
        "last_name",
        "email",
        "phone_number",
        "risk_level_id",
        "risk_point",
        "sid",
        "investor_type_id",
      ];

      const old_value: Record<string, unknown> = {};
      const new_value: Record<string, unknown> = {};

      for (const field of fields) {
        if (field in input.data) {
          const next = (input.data as any)[field];
          const prev = (current as any)[field];
          if (next !== undefined && next !== prev) {
            old_value[field] = prev;
            new_value[field] = next;
          }
        }
      }

      if (Object.keys(new_value).length === 0) {
        return { changed: false, journalId: null };
      }

      const journal = await ctx.prisma.journals.create({
        data: {
          entity: "investors",
          entity_id: input.id,
          action: "UPDATE",
          status: "PENDING",
          requested_by: ctx.session.user.id,
          requested_at: new Date(),
          reason: input.reason ?? null,
          entity_version: current.version,
        },
      });

      await ctx.prisma.journal_details.create({
        data: {
          journal_id: journal.id,
          old_value: old_value as unknown as Prisma.JsonObject,
          new_value: new_value as unknown as Prisma.JsonObject,
        },
      });

      return { changed: true, journalId: journal.id };
    }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const investor = await ctx.prisma.investors.findUnique({
        where: { id: input.id },
        include: {
          investor_addresses: true,
          investor_heirs: true,
          investor_individuals: true,
          investor_corporates: true,
          investor_banks: true,
        },
      });
      return investor;
    }),
  portfolio: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await ctx.prisma.investor_holdings.findMany({
        where: { investor_id: input.id },
        orderBy: { created_at: "desc" },
        distinct: ["fund_id"],
        select: { fund_id: true, units_after: true },
      });

      const fundIds = portfolio.map((p) => p.fund_id);
      if (fundIds.length === 0) return [];

      const [funds, modalByFundRows] = await Promise.all([
        ctx.prisma.funds.findMany({
          where: { id: { in: fundIds } },
          select: {
            id: true,
            name: true,
            code: true,
            fund_navs: {
              orderBy: { date: "desc" },
              take: 1,
              select: { nav_per_unit: true, date: true },
            },
          },
        }),
        ctx.prisma.transactions.groupBy({
          by: ["fund_id"],
          where: {
            investor_id: input.id,
            fund_id: { in: fundIds },
            transaction_type: { in: ["SUBSCRIPTION", "SWITCHING_IN"] },
          },
          _sum: { net_amount: true },
        }),
      ]);

      const fundMap = new Map(funds.map((f) => [f.id, f]));
      const modalByFund = new Map(
        modalByFundRows.map((r) => [r.fund_id, toNum(r._sum.net_amount)])
      );

      return portfolio.map((p) => {
        const fund = fundMap.get(p.fund_id);
        const latestNav = fund?.fund_navs?.[0];
        const navPerUnit = latestNav ? toNum(latestNav.nav_per_unit) : 0;
        const units = toNum(p.units_after);
        const modal = modalByFund.get(p.fund_id) ?? 0;
        const value = units * navPerUnit;
        const avgPrice = units > 0 ? modal / units : 0;
        const profitAndLoss = value - modal;
        const returnPct = modal > 0 ? (profitAndLoss / modal) * 100 : 0;

        return {
          fund_id: p.fund_id,
          units_after: p.units_after,
          fund: fund
            ? {
                id: fund.id,
                name: fund.name,
                code: fund.code,
                latest_nav: latestNav
                  ? { nav_per_unit: latestNav.nav_per_unit, date: latestNav.date }
                  : null,
              }
            : null,
          modal,
          avg_price: avgPrice,
          value,
          profit_and_loss: profitAndLoss,
          return_pct: returnPct,
        };
      });
    }),
  journals: publicProcedure
    .input(
      z.object({
        investorId: z.string(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const limit = input.limit ?? 10;
      const skip = (page - 1) * limit;

      const baseWhere: PrismaTypes.journalsWhereInput = {
        entity: "investors",
        entity_id: input.investorId,
      };
      const where: PrismaTypes.journalsWhereInput = input.status
        ? { ...baseWhere, status: input.status }
        : baseWhere;

      const [items, total, grouped] = await Promise.all([
        ctx.prisma.journals.findMany({
          where,
          orderBy: { requested_at: "desc" },
          skip,
          take: limit,
          include: {
            requested_user: { select: { id: true, name: true } },
            approved_user: { select: { id: true, name: true } },
            journal_detail: true,
          },
        }),
        ctx.prisma.journals.count({ where }),
        ctx.prisma.journals.groupBy({
          by: ["status"],
          where: baseWhere,
          _count: { _all: true },
        }),
      ]);

      const statusCounts: Record<string, number> = {};
      for (const row of grouped) {
        statusCounts[row.status] = row._count._all;
      }

      return {
        items,
        total,
        page,
        limit,
        statusCounts,
      };
    }),
  approveJournal: publicProcedure
    .input(
      z.object({
        journalId: z.number(),
        approvedBy: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const journal = await ctx.prisma.journals.findUnique({
        where: { id: input.journalId },
        include: { journal_detail: true },
      });

      if (!journal) {
        throw new Error("Journal not found");
      }
      if (journal.entity !== "investors") {
        throw new Error("Unsupported entity for this endpoint");
      }
      if (journal.status !== "PENDING") {
        throw new Error("Only pending journals can be approved");
      }

      const investor = await ctx.prisma.investors.findUnique({
        where: { id: journal.entity_id! },
      });
      if (!investor) {
        throw new Error("Investor not found");
      }

      if (journal.entity_version != null && journal.entity_version !== investor.version) {
        await ctx.prisma.journals.update({
          where: { id: journal.id },
          data: {
            status: "REJECTED",
            rejection_reason:
              "Stale version: investor profile has changed since this request was created.",
            approved_by: input.approvedBy,
            approved_at: new Date(),
          },
        });
        throw new Error("Journal is stale and has been rejected. Please resubmit from latest data.");
      }

      const detail = journal.journal_detail;
      const newValue = (detail?.new_value ?? {}) as Prisma.JsonObject;
      const updateData: PrismaTypes.investorsUpdateInput = {};

      const copyIfPresent = (field: string) => {
        if (field in newValue) {
          (updateData as any)[field] = (newValue as any)[field];
        }
      };

      copyIfPresent("external_code");
      copyIfPresent("first_name");
      copyIfPresent("middle_name");
      copyIfPresent("last_name");
      copyIfPresent("email");
      copyIfPresent("phone_number");
      copyIfPresent("risk_level_id");
      copyIfPresent("risk_point");
      copyIfPresent("sid");
      copyIfPresent("investor_type_id");

      const updated = await ctx.prisma.investors.update({
        where: { id: journal.entity_id! },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
      });

      await ctx.prisma.journals.update({
        where: { id: journal.id },
        data: {
          status: "APPROVED",
          approved_by: input.approvedBy,
          approved_at: new Date(),
          applied_at: new Date(),
          entity_version: updated.version,
        },
      });

      return { success: true, newVersion: updated.version };
    }),
  rejectJournal: publicProcedure
    .input(
      z.object({
        journalId: z.number(),
        rejectedBy: z.number().int(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const journal = await ctx.prisma.journals.findUnique({
        where: { id: input.journalId },
      });

      if (!journal) {
        throw new Error("Journal not found");
      }
      if (journal.status !== "PENDING") {
        throw new Error("Only pending journals can be rejected");
      }

      await ctx.prisma.journals.update({
        where: { id: input.journalId },
        data: {
          status: "REJECTED",
          rejection_reason: input.reason ?? null,
          approved_by: input.rejectedBy,
          approved_at: new Date(),
        },
      });

      return { success: true };
    }),
});
