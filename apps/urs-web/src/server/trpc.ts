import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import prisma from "@investment/urs";
import type { Session } from "next-auth";
import { auth } from "@/auth";

export function createContext(opts: FetchCreateContextFnOptions) {
  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    prisma,
    session: null as Session | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(async ({ ctx, next }) => {
  const session = await auth();

  if (!session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
