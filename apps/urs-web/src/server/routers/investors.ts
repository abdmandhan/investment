import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import type { Prisma } from "@investment/urs";

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

      let where: Prisma.investorsWhereInput = {};

      if (input?.searchs) {
        for (const search of input.searchs) {
          if (search.value) {
            // @ts-ignore
            where[search.key] = { contains: search.value, mode: "insensitive" };
          }
        }
      }

      console.log('where', where)

      const [items, total] = await Promise.all([
        ctx.prisma.investors.findMany({
          take: limit,
          skip,
          orderBy: { [sort]: sort_by },
          where
        }),
        ctx.prisma.investors.count(),
      ]);

      return {
        items: items.map((row) => ({
          id: row.id,
          name: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" "),
          email: row.email ?? undefined,
          phone_number: row.phone_number ?? undefined,
          investor_type_id: row.investor_type_id,
          sid: row.sid
        })),
        total,
        page,
        limit,
      };
    }),
});
