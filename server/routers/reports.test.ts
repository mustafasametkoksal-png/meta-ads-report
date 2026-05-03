import { describe, expect, it, vi, beforeEach } from "vitest";
import { reportsRouter } from "./reports";
import * as db from "../db";

// Mock dependencies
vi.mock("../db", () => ({
  createReport: vi.fn(),
  getUserReports: vi.fn(),
  getReportByShareToken: vi.fn(),
  deleteReport: vi.fn(),
}));

vi.mock("../services/metaAdsScraper", () => ({
  scrapeMetaAdsLibrary: vi.fn().mockResolvedValue({
    brandName: "Test Brand",
    pageId: "123456",
    totalAds: 5,
    ads: [
      {
        id: "ad_0",
        libraryId: "111222333",
        body: "Test ad body",
        startDate: "1 Jan 2026",
        daysRunning: 90,
        cta: "Shop Now",
        platforms: ["Facebook", "Instagram"],
        format: "Image/Carousel",
        libraryUrl: "https://www.facebook.com/ads/library/?id=111222333",
      },
    ],
    platformCounts: { Facebook: 3, Instagram: 4, Messenger: 0, "Audience Network": 0 },
    videoCount: 2,
    staticCount: 3,
    ctaCounts: { "Shop Now": 4, "Watch More": 1 },
    monthlyTrend: { "2026-01": 3, "2026-02": 2 },
  }),
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-share-token-123"),
}));

// Public context — no user
function createPublicContext() {
  return {
    user: null as any,
    req: {} as any,
    res: {} as any,
  };
}

describe("reports router (public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a multi-brand report without auth", async () => {
    const caller = reportsRouter.createCaller(createPublicContext());

    const result = await caller.scrapeAndCreateMulti({
      brands: [
        { name: "Test Brand", url: "https://www.facebook.com/ads/library/?view_all_page_id=123", color: "#10b981" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.shareToken).toBe("test-share-token-123");
    expect(result.brands).toHaveLength(1);
    expect(result.brands[0].name).toBe("Test Brand");
    expect(result.brands[0].adsCount).toBe(5);
    expect(db.createReport).toHaveBeenCalled();
  });

  it("should create a multi-brand report with 2 brands", async () => {
    const caller = reportsRouter.createCaller(createPublicContext());

    const result = await caller.scrapeAndCreateMulti({
      brands: [
        { name: "Brand A", url: "https://www.facebook.com/ads/library/?view_all_page_id=111", color: "#10b981" },
        { name: "Brand B", url: "https://www.facebook.com/ads/library/?view_all_page_id=222", color: "#ec4899" },
      ],
      reportName: "My Custom Report",
    });

    expect(result.success).toBe(true);
    expect(result.reportName).toBe("My Custom Report");
    expect(result.brands).toHaveLength(2);
  });

  it("should use brand names as report name when no custom name given", async () => {
    const caller = reportsRouter.createCaller(createPublicContext());

    const result = await caller.scrapeAndCreateMulti({
      brands: [
        { name: "Oysho", url: "https://www.facebook.com/ads/library/?view_all_page_id=123", color: "#10b981" },
        { name: "Lululemon", url: "https://www.facebook.com/ads/library/?view_all_page_id=456", color: "#6366f1" },
      ],
    });

    expect(result.reportName).toBe("Oysho, Lululemon Raporu");
  });

  it("should get report by share token (public)", async () => {
    const mockReport = {
      id: 1,
      userId: 0,
      shareToken: "token-123",
      reportName: "Test Report",
      brandCount: 2,
      reportData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getReportByShareToken).mockResolvedValue(mockReport);

    const caller = reportsRouter.createCaller(createPublicContext());
    const result = await caller.getByShareToken("token-123");

    expect(result).toEqual(mockReport);
    expect(db.getReportByShareToken).toHaveBeenCalledWith("token-123");
  });

  it("should list reports by tokens", async () => {
    const mockReport = {
      id: 1,
      userId: 0,
      shareToken: "token-abc",
      reportName: "Report 1",
      brandCount: 2,
      reportData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getReportByShareToken).mockResolvedValue(mockReport);

    const caller = reportsRouter.createCaller(createPublicContext());
    const result = await caller.listByTokens(["token-abc"]);

    expect(result).toHaveLength(1);
    expect(result[0]?.shareToken).toBe("token-abc");
  });

  it("should delete a report by shareToken without auth", async () => {
    const mockReport = {
      id: 1,
      userId: 0,
      shareToken: "token-1",
      reportName: "Report 1",
      brandCount: 1,
      reportData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getReportByShareToken).mockResolvedValue(mockReport);

    const caller = reportsRouter.createCaller(createPublicContext());
    const result = await caller.delete({ shareToken: "token-1" });

    expect(result).toEqual({ success: true });
    expect(db.deleteReport).toHaveBeenCalledWith(1);
  });

  it("should throw error when deleting a non-existent report", async () => {
    vi.mocked(db.getReportByShareToken).mockResolvedValue(undefined);

    const caller = reportsRouter.createCaller(createPublicContext());

    await expect(caller.delete({ shareToken: "nonexistent" })).rejects.toThrow(
      "Report not found"
    );
  });
});
