import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createReport, getReportByShareToken, deleteReport } from "../db";
import { scrapeMetaAdsLibrary } from "../services/metaAdsScraper";
import { nanoid } from "nanoid";

export const reportsRouter = router({
  // Scrape multiple brands and create a single combined report (public)
  scrapeAndCreateMulti: publicProcedure
    .input(
      z.object({
        brands: z.array(
          z.object({
            name: z.string().min(1).max(255),
            url: z.string().url(),
            color: z.string().regex(/^#[0-9A-F]{6}$/i),
          })
        ).min(1).max(3),
        reportName: z.string().min(1).max(255).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Scrape all brands in parallel
        const results = await Promise.all(
          input.brands.map((brand) =>
            scrapeMetaAdsLibrary(brand.url, brand.name)
          )
        );

        const shareToken = nanoid(32);
        const brandNames = input.brands.map((b) => b.name).join(", ");
        const reportName = input.reportName || `${brandNames} Raporu`;

        // Build report data keyed by brand name
        const reportData: Record<string, any> = {};
        input.brands.forEach((brand, idx) => {
          reportData[brand.name] = {
            name: brand.name,
            color: brand.color,
            url: brand.url,
            ...results[idx],
          };
        });

        await createReport({
          userId: 0, // anonymous — no login required
          shareToken,
          reportName,
          brandCount: input.brands.length,
          reportData: reportData as any,
        });

        return {
          success: true,
          shareToken,
          reportName,
          brands: results.map((r) => ({
            name: r.brandName,
            adsCount: r.totalAds,
          })),
        };
      } catch (error) {
        console.error("[Reports] Scrape error:", error);
        throw new Error(
          `Failed to scrape Meta Ads Library: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  // Get reports by a list of shareTokens (stored in localStorage on client)
  listByTokens: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input }) => {
      if (input.length === 0) return [];
      const results = await Promise.all(
        input.map((token) => getReportByShareToken(token))
      );
      return results.filter(Boolean);
    }),

  // Get a report by share token (public)
  getByShareToken: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await getReportByShareToken(input);
    }),

  // Delete a report by shareToken (no auth — token acts as ownership proof)
  delete: publicProcedure
    .input(z.object({ shareToken: z.string() }))
    .mutation(async ({ input }) => {
      const report = await getReportByShareToken(input.shareToken);
      if (!report) throw new Error("Report not found");
      await deleteReport(report.id);
      return { success: true };
    }),
});
