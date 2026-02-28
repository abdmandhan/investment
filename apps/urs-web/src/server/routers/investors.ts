import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const investorsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).optional().default(1),
          limit: z.number().min(1).max(100).optional().default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ctx.prisma.investors.findMany({
          take: limit,
          skip,
          orderBy: { created_at: "desc" },
        }),
        ctx.prisma.investors.count(),
      ]);

      return {
        items: items.map((row) => ({
          id: row.id,
          name: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" "),
          email: row.email ?? undefined,
          phone_number: row.phone_number ?? undefined,
        })),
        total,
        page,
        limit,
      };
    }),
});
