import puppeteer from "puppeteer";
import { execSync } from "child_process";
import fs from "fs";
import type { AdData, BrandAdsData } from "./metaAdsScraper";
import { TARGET_ADS } from "./metaAdsScraper";

/**
 * TikTok Commercial Content Library scraper.
 *
 * This targets TikTok's transparency archive (the closest analogue to Meta Ads
 * Library): https://library.tiktok.com/ads — which lists the paid ads an
 * advertiser has run. NOTE: this archive only covers ads SHOWN IN THE EU, so a
 * brand's Turkey/global campaigns may not appear here. That caveat is surfaced
 * to the user in the report UI.
 *
 * Returns the same BrandAdsData shape as the Meta scraper so the report UI can
 * render both sources uniformly. Some Meta-specific fields (Messenger/Audience
 * Network platform counts) are simply left at zero for TikTok.
 */

function findChrome(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    "/usr/lib/chromium/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  try {
    const result = execSync("which chromium || which chromium-browser || which google-chrome", { encoding: "utf8" }).trim();
    if (result && fs.existsSync(result)) return result;
  } catch {}
  throw new Error("Chrome/Chromium not found. Set PUPPETEER_EXECUTABLE_PATH or install chromium.");
}

function parseDateToMs(dateStr: string): number {
  const cleaned = dateStr.replace(/·.*$/, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

function daysSince(dateStr: string): number {
  const ms = parseDateToMs(dateStr);
  return Math.max(0, Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24)));
}

/** Pull an advertiser/page identifier out of common TikTok library URL shapes. */
function extractTikTokId(url: string): string {
  const patterns = [
    /advertiser_business_ids=([^&]+)/i,
    /advertiser_id=([^&]+)/i,
    /[?&]id=([^&]+)/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return decodeURIComponent(m[1]);
  }
  return "";
}

export async function scrapeTikTokAdsLibrary(url: string, brandName: string): Promise<BrandAdsData> {
  const pageId = extractTikTokId(url);
  let browser;

  try {
    const chromePath = findChrome();
    console.log(`[TikTok Scraper] Using Chrome: ${chromePath}`);
    browser = await puppeteer.launch({
      headless: true,
      ...(chromePath ? { executablePath: chromePath } : {}),
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log(`[TikTok Scraper] Loading: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    // TikTok's library hydrates content client-side; give it a beat.
    await new Promise((r) => setTimeout(r, 3500));

    // Reported total ("N results" / "N sonuç")
    const reportedTotal = await page.evaluate(() => {
      const text = document.body.innerText;
      const patterns = [/([\d.,]+)\s+results?/i, /([\d.,]+)\s+ads?/i, /([\d.,]+)\s+sonu[çc]/i];
      for (const re of patterns) {
        const m = text.match(re);
        if (m) {
          const n = parseInt(m[1].replace(/[.,]/g, ""), 10);
          if (!isNaN(n)) return n;
        }
      }
      return null;
    });
    console.log(`[TikTok Scraper] Reported total for ${brandName}: ${reportedTotal ?? "unknown"}`);

    // Scroll to load cards until we hit the target or stop making progress.
    let lastCount = 0;
    let stagnant = 0;
    for (let i = 0; i < 16; i++) {
      await page.evaluate(() => window.scrollBy(0, 2500));
      await new Promise((r) => setTimeout(r, 1500));
      const count = await page.evaluate(() => {
        // Card detection: TikTok library cards expose "See details" / ad metadata.
        // Count anchors/containers that look like individual ad cards.
        const cards = document.querySelectorAll(
          "[class*='adCard'], [class*='ad-card'], [data-testid*='ad'], a[href*='/ad/']"
        );
        if (cards.length) return cards.length;
        // Fallback: count "See details" occurrences in text.
        return (document.body.innerText.match(/See details|Detayları gör/gi) || []).length;
      });
      if (count >= TARGET_ADS) break;
      if (count === lastCount) {
        stagnant++;
        if (stagnant >= 3) break;
      } else {
        stagnant = 0;
      }
      lastCount = count;
    }

    // Extract structured data from cards. We try DOM selectors first and fall
    // back to text parsing, mirroring the Meta scraper's resilience approach.
    const rawData = await page.evaluate((targetAds) => {
      const out: any[] = [];

      const cardEls = Array.from(
        document.querySelectorAll(
          "[class*='adCard'], [class*='ad-card'], [data-testid*='ad']"
        )
      ).slice(0, targetAds);

      const grabText = (el: Element | null) => (el ? (el.textContent || "").trim() : "");

      cardEls.forEach((card, idx) => {
        const cardText = (card as HTMLElement).innerText || "";

        // Caption: longest meaningful text node in the card.
        const candidates = cardText
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        const caption =
          candidates.sort((a, b) => b.length - a.length)[0] || `Ad ${idx + 1}`;

        // First-shown date
        const dateMatch = cardText.match(
          /(?:First shown|İlk gösterim|First seen)[:\s]*([0-9]{1,2}\s+\w+\s+[0-9]{4}|\w+ [0-9]{1,2}, [0-9]{4})/i
        );
        const startDate = dateMatch ? dateMatch[1].trim() : "";

        // Ad detail link → id
        const link = card.querySelector("a[href*='/ad/']") as HTMLAnchorElement | null;
        const href = link?.href || "";
        const idMatch = href.match(/\/ad\/([^/?]+)/);
        const adId = idMatch ? idMatch[1] : `tt_${idx}`;

        out.push({
          id: `ad_${idx}`,
          libraryId: adId,
          body: caption,
          startDate,
          cta: "Belirsiz", // TikTok library rarely exposes a discrete CTA label
          platforms: ["TikTok"],
          format: "Video", // TikTok ads are overwhelmingly video
          libraryUrl: href || "https://library.tiktok.com/ads",
        });
      });

      // Fallback: if no cards matched, segment by "See details".
      if (out.length === 0) {
        const text = document.body.innerText;
        const segs = text.split(/(?=See details|Detayları gör)/i).slice(0, targetAds);
        segs.forEach((seg, idx) => {
          const lines = seg.split("\n").map((s) => s.trim()).filter(Boolean);
          const caption = lines.sort((a, b) => b.length - a.length)[0] || `Ad ${idx + 1}`;
          const dateMatch = seg.match(/([0-9]{1,2}\s+\w+\s+[0-9]{4})/);
          out.push({
            id: `ad_${idx}`,
            libraryId: `tt_${idx}`,
            body: caption,
            startDate: dateMatch ? dateMatch[1] : "",
            cta: "Belirsiz",
            platforms: ["TikTok"],
            format: "Video",
            libraryUrl: "https://library.tiktok.com/ads",
          });
        });
      }

      return out;
    }, TARGET_ADS);

    const ads: AdData[] = rawData.map((ad: any) => ({
      ...ad,
      daysRunning: ad.startDate ? daysSince(ad.startDate) : 0,
    }));

    const platformCounts: Record<string, number> = {
      TikTok: ads.length,
      Facebook: 0,
      Instagram: 0,
      Messenger: 0,
      "Audience Network": 0,
    };

    const ctaCounts: Record<string, number> = {};
    ads.forEach((ad) => {
      ctaCounts[ad.cta] = (ctaCounts[ad.cta] || 0) + 1;
    });

    const videoCount = ads.filter((a) => a.format === "Video").length;
    const staticCount = ads.length - videoCount;

    const monthlyTrend: Record<string, number> = {};
    ads.forEach((ad) => {
      if (!ad.startDate) return;
      const d = new Date(parseDateToMs(ad.startDate));
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyTrend[key] = (monthlyTrend[key] || 0) + 1;
    });

    await browser.close();

    return {
      brandName,
      pageId,
      source: "tiktok",
      totalAds: ads.length,
      reportedTotal,
      ads,
      platformCounts,
      videoCount,
      staticCount,
      ctaCounts,
      monthlyTrend,
    };
  } catch (error) {
    console.error("[TikTok Scraper] Error:", error);
    if (browser) await browser.close();
    throw error;
  }
}
