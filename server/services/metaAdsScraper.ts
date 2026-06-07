import puppeteer from "puppeteer";
import { execSync } from "child_process";
import fs from "fs";

// ─── How many ads to collect ──────────────────────────────────────────────────
// Bumped from 10 → 20 per brand. Scroll count is derived from this target.
export const TARGET_ADS = 20;

// Resolve Chrome executable
function findChrome(): string {
  // 1. Environment variable (set in Docker / Railway)
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    console.log(`[Scraper] Using PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 2. Common system locations
  const candidates = [
    "/usr/lib/chromium/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log(`[Scraper] Found Chrome at: ${p}`);
      return p;
    }
  }

  // 3. Try `which` as last resort
  try {
    const result = execSync("which chromium || which chromium-browser || which google-chrome", { encoding: "utf8" }).trim();
    if (result && fs.existsSync(result)) return result;
  } catch {}

  throw new Error("Chrome/Chromium not found. Set PUPPETEER_EXECUTABLE_PATH or install chromium.");
}

export interface AdData {
  id: string;
  libraryId: string;
  body: string; // full caption text
  startDate: string;
  daysRunning: number;
  cta: string;
  platforms: string[];
  format: string;
  libraryUrl: string;
}

export interface BrandAdsData {
  brandName: string;
  pageId: string;
  source: "meta" | "tiktok"; // which ad library this came from
  totalAds: number; // how many ads we actually scraped (ads.length)
  reportedTotal: number | null; // total the library reports for this page (null if unknown)
  ads: AdData[];
  platformCounts: Record<string, number>;
  videoCount: number;
  staticCount: number;
  ctaCounts: Record<string, number>;
  monthlyTrend: Record<string, number>;
}

function parseDateToMs(dateStr: string): number {
  // "20 Apr 2026", "11 Mar 2026", "17 Sep 2025"
  const cleaned = dateStr.replace(/·.*$/, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

function daysSince(dateStr: string): number {
  const ms = parseDateToMs(dateStr);
  const now = Date.now();
  return Math.max(0, Math.floor((now - ms) / (1000 * 60 * 60 * 24)));
}

function extractPageId(url: string): string {
  const match = url.match(/view_all_page_id=(\d+)/);
  return match ? match[1] : "";
}

export async function scrapeMetaAdsLibrary(url: string, brandName: string): Promise<BrandAdsData> {
  const pageId = extractPageId(url);
  let browser;

  try {
    const chromePath = findChrome();
    console.log(`[Scraper] Using Chrome: ${chromePath ?? "puppeteer default"}`);
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

    console.log(`[Scraper] Loading: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // ── Read the "~N results" total the library reports, before scrolling ──
    const reportedTotal = await page.evaluate(() => {
      const text = document.body.innerText;
      // Meta shows e.g. "~250 results", "1,2K results", "About 320 results", or Turkish "≈250 sonuç"
      const patterns = [
        /~?\s*([\d.,]+)\s+results?/i,
        /([\d.,]+)\s+sonu[çc]/i,
        /about\s+([\d.,]+)\s+results?/i,
      ];
      for (const re of patterns) {
        const m = text.match(re);
        if (m) {
          const n = parseInt(m[1].replace(/[.,]/g, ""), 10);
          if (!isNaN(n)) return n;
        }
      }
      return null;
    });
    console.log(`[Scraper] Reported total for ${brandName}: ${reportedTotal ?? "unknown"}`);

    // ── Scroll until we have enough ad blocks (target 20) or run out ──
    let lastCount = 0;
    let stagnant = 0;
    const maxScrolls = 14;
    for (let i = 0; i < maxScrolls; i++) {
      await page.evaluate(() => window.scrollBy(0, 2500));
      await new Promise((r) => setTimeout(r, 1300));

      const count = await page.evaluate(() => {
        const blocks = document.body.innerText.split(/\n(?=Active\n)/);
        return blocks.filter((b) => b.includes("Library ID:")).length;
      });

      if (count >= TARGET_ADS) break;
      // Stop early if scrolling no longer loads new ads (reached the end)
      if (count === lastCount) {
        stagnant++;
        if (stagnant >= 3) break;
      } else {
        stagnant = 0;
      }
      lastCount = count;
    }

    // Extract all data via text parsing (most reliable approach)
    const rawData = await page.evaluate((targetAds) => {
      const text = document.body.innerText;

      // Split by "Active" markers to get individual ad blocks
      const blocks = text.split(/\n(?=Active\n)/);
      const adBlocks = blocks.filter((b) => b.includes("Library ID:")).slice(0, targetAds);

      const ads: any[] = [];
      adBlocks.forEach((block, idx) => {
        const libMatch = block.match(/Library ID:\s*(\d+)/);
        const dateMatch = block.match(/Started running on\s+([^\n·]+)/);

        // ── Full caption extraction ──
        // After the "Sponsored" line, Meta renders the primary text (caption).
        // Capture everything up to the first structural boundary instead of just one line.
        let bodyText = "";
        const sponsoredIdx = block.indexOf("Sponsored\n");
        if (sponsoredIdx >= 0) {
          const after = block.substring(sponsoredIdx + "Sponsored\n".length);
          // Cut the caption at the first marker that signals the end of primary text.
          const stopMarkers = [
            "\nLibrary ID:",
            "\nSee ad details",
            "\nSee summary details",
            "\nShop Now",
            "\nLearn More",
            "\nWatch More",
            "\nSign Up",
            "\nBook Now",
            "\nDownload",
            "\nGet Offer",
            "\nContact Us",
            "\nApply Now",
            "\nSend Message",
            "\nSee Menu",
            "\nGet Quote",
          ];
          let cut = after.length;
          for (const m of stopMarkers) {
            const mi = after.indexOf(m);
            if (mi >= 0 && mi < cut) cut = mi;
          }
          bodyText = after.substring(0, cut).trim();
          // Collapse excessive blank lines but keep line breaks within the caption
          bodyText = bodyText.replace(/\n{3,}/g, "\n\n").trim();
        }

        // Extract CTA - common Meta Ads CTAs
        const ctaPatterns = [
          "Shop Now",
          "Watch More",
          "Learn More",
          "Sign Up",
          "Book Now",
          "Download",
          "Get Offer",
          "Contact Us",
          "Apply Now",
          "Subscribe",
          "Get Quote",
          "Request Time",
          "See Menu",
          "Send Message",
          "Call Now",
        ];
        let cta = "";
        for (const pattern of ctaPatterns) {
          if (block.includes(pattern)) {
            cta = pattern;
            break;
          }
        }
        // Mark unknown CTAs explicitly instead of silently defaulting to "Shop Now",
        // which previously inflated the CTA stats.
        if (!cta) cta = "Belirsiz";

        // Detect platforms from platform icons text
        const platforms: string[] = [];
        if (block.includes("Facebook") || block.includes("facebook")) platforms.push("Facebook");
        if (block.includes("Instagram") || block.includes("instagram")) platforms.push("Instagram");
        if (block.includes("Messenger") || block.includes("messenger")) platforms.push("Messenger");
        if (block.includes("Audience Network")) platforms.push("Audience Network");
        // Default: assume Facebook + Instagram if no specific platform found
        if (platforms.length === 0) {
          platforms.push("Facebook", "Instagram");
        }

        // Detect format — video ads show a timestamp like "0:00 / 0:23" or have Play Video button hint
        const isVideo =
          /0:00\s*\/\s*\d+:\d+/.test(block) ||
          block.includes("Play Video") ||
          block.includes("play video");
        const format = isVideo ? "Video" : "Image/Carousel";

        const libraryId = libMatch ? libMatch[1] : `unknown_${idx}`;
        const startDate = dateMatch ? dateMatch[1].trim() : "";

        ads.push({
          id: `ad_${idx}`,
          libraryId,
          body: bodyText || `Ad ${idx + 1}`,
          startDate,
          cta,
          platforms,
          format,
        });
      });

      return ads;
    }, TARGET_ADS);

    // Post-process: calculate days running, monthly trend, platform counts, CTA counts
    const ads: AdData[] = rawData.map((ad: any) => ({
      ...ad,
      daysRunning: daysSince(ad.startDate),
      libraryUrl: `https://www.facebook.com/ads/library/?id=${ad.libraryId}`,
    }));

    // Platform counts
    const platformCounts: Record<string, number> = {
      Facebook: 0,
      Instagram: 0,
      Messenger: 0,
      "Audience Network": 0,
    };
    ads.forEach((ad) => {
      ad.platforms.forEach((p) => {
        if (platformCounts[p] !== undefined) platformCounts[p]++;
      });
    });

    // CTA counts
    const ctaCounts: Record<string, number> = {};
    ads.forEach((ad) => {
      ctaCounts[ad.cta] = (ctaCounts[ad.cta] || 0) + 1;
    });

    // Format counts
    const videoCount = ads.filter((a) => a.format === "Video").length;
    const staticCount = ads.length - videoCount;

    // Monthly trend (ads started per month)
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
      source: "meta",
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
    console.error("[Scraper] Error:", error);
    if (browser) await browser.close();
    throw error;
  }
}
