import { router } from "../trpc";
import { investorsRouter } from "./investors";

export const appRouter = router({
  investors: investorsRouter,
});

export type AppRouter = typeof appRouter;
