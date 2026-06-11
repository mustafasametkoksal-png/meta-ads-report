import type { Express, Request, Response } from "express";
import puppeteer from "puppeteer";
import { findChrome } from "./services/metaAdsScraper";
import { getReportByShareToken } from "./db";

/**
 * GET /api/report-pdf/:token
 *
 * Renders the report's print view (`/report/:token?print=1`) in the same
 * Chromium that powers the scrapers and streams it back as an A4 PDF.
 * White-label ready: the print view is a clean, stacked, chrome-free layout.
 */
export function registerPdfRoute(app: Express, getPort: () => number) {
  let inFlight = 0;
  const MAX_IN_FLIGHT = 2;

  app.get("/api/report-pdf/:token", async (req: Request, res: Response) => {
    const token = String(req.params.token || "");
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) {
      res.status(400).send("Invalid token");
      return;
    }

    if (inFlight >= MAX_IN_FLIGHT) {
      res.status(429).send("PDF oluşturucu meşgul — lütfen biraz sonra tekrar deneyin.");
      return;
    }

    // Verify the report exists before paying the Chromium cost
    const report = await getReportByShareToken(token).catch(() => undefined);
    if (!report) {
      res.status(404).send("Report not found");
      return;
    }

    inFlight++;
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: findChrome(),
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1240, height: 1600 });

      const url = `http://127.0.0.1:${getPort()}/report/${token}?print=1`;
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
      // Give Recharts time to mount + animate into final positions
      await new Promise((r) => setTimeout(r, 2800));

      // Walk the full page so lazy-loaded creatives & below-the-fold content
      // actually render before printing (page.pdf does not trigger lazy load)
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let y = 0;
          const step = () => {
            y += 1200;
            window.scrollTo(0, y);
            if (y < document.body.scrollHeight) setTimeout(step, 120);
            else {
              window.scrollTo(0, 0);
              resolve();
            }
          };
          step();
        });
      });
      await new Promise((r) => setTimeout(r, 800));

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", bottom: "14mm", left: "10mm", right: "10mm" },
      });

      const safeName = report.reportName
        .replace(/[^\p{L}\p{N} _-]/gu, "")
        .replace(/\s+/g, "-")
        .slice(0, 80) || "rapor";

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(safeName)}.pdf"`
      );
      res.send(Buffer.from(pdf));
    } catch (error) {
      console.error("[PDF] Failed:", error);
      res.status(500).send("PDF oluşturulamadı");
    } finally {
      if (browser) await browser.close().catch(() => {});
      inFlight--;
    }
  });
}
