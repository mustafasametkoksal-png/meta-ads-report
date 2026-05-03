import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { reportsRouter } from "./routers/reports";

export const appRouter = router({
  system: systemRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
