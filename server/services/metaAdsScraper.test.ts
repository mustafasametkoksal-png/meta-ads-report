import { describe, expect, it } from "vitest";
import { parseDateToMs, parseAdCardText, aggregateBrandStats, type AdData } from "./metaAdsScraper";

describe("parseDateToMs", () => {
  it("parses English dates (d Mon yyyy)", () => {
    const ms = parseDateToMs("20 Apr 2026");
    expect(ms).not.toBeNull();
    expect(new Date(ms!).getUTCMonth()).toBe(3);
    expect(new Date(ms!).getUTCDate()).toBe(20);
  });

  it("parses Turkish dates (d Ay yyyy)", () => {
    const ms = parseDateToMs("20 Nis 2026");
    expect(ms).not.toBeNull();
    expect(new Date(ms!).getUTCMonth()).toBe(3);

    const eki = parseDateToMs("5 Eki 2025");
    expect(new Date(eki!).getUTCMonth()).toBe(9);

    const agu = parseDateToMs("12 Ağu 2025");
    expect(new Date(agu!).getUTCMonth()).toBe(7);
  });

  it("parses US-style dates (Mon d, yyyy)", () => {
    const ms = parseDateToMs("Apr 20, 2026");
    expect(new Date(ms!).getUTCMonth()).toBe(3);
    expect(new Date(ms!).getUTCDate()).toBe(20);
  });

  it("strips trailing platform markers after ·", () => {
    const ms = parseDateToMs("17 Sep 2025 · Total active time");
    expect(new Date(ms!).getUTCMonth()).toBe(8);
  });

  it("returns null (not 'now') for unparseable input", () => {
    expect(parseDateToMs("garbage")).toBeNull();
    expect(parseDateToMs("")).toBeNull();
  });
});

describe("parseAdCardText", () => {
  const enCard = [
    "Active",
    "Library ID: 123456789012345",
    "Started running on 20 Apr 2026",
    "Platforms",
    "Facebook Instagram",
    "Brand Name",
    "Sponsored",
    "Yeni koleksiyon geldi! Learn More yazan butona değil, hayalinizdeki ürüne tıklayın.",
    "İkinci satır caption devamı.",
    "Shop Now",
    "See ad details",
  ].join("\n");

  it("extracts library id, date, and full multi-line caption", () => {
    const ad = parseAdCardText(enCard, 0);
    expect(ad.libraryId).toBe("123456789012345");
    expect(ad.startDate).toBe("20 Apr 2026");
    expect(ad.body).toContain("Yeni koleksiyon geldi!");
    expect(ad.body).toContain("İkinci satır caption devamı.");
  });

  it("does NOT pick CTA from caption text (false-positive guard)", () => {
    // Caption contains "Learn More" but the real CTA button is "Shop Now"
    const ad = parseAdCardText(enCard, 0);
    expect(ad.cta).toBe("Shop Now");
  });

  it("parses Turkish-locale cards", () => {
    const trCard = [
      "Aktif",
      "Kitaplık Kimliği: 987654321098765",
      "Yayınlanmaya başladığı tarih: 12 Nis 2026",
      "Marka",
      "Sponsorlu",
      "Bahar indirimi başladı, %40'a varan fırsatlar!",
      "Şimdi satın al",
    ].join("\n");
    const ad = parseAdCardText(trCard, 0);
    expect(ad.libraryId).toBe("987654321098765");
    expect(ad.startDate).toBe("12 Nis 2026");
    expect(ad.body).toContain("Bahar indirimi");
    expect(ad.cta).toBe("Şimdi satın al");
  });

  it("marks unknown CTA as Belirsiz instead of defaulting", () => {
    const card = "Active\nLibrary ID: 111\nStarted running on 1 Jan 2026\nSponsored\nMerhaba dünya";
    expect(parseAdCardText(card, 0).cta).toBe("Belirsiz");
  });

  it("matches CTA case-insensitively and canonicalizes (Shop now -> Shop Now)", () => {
    const card = [
      "Active", "Library ID: 222", "Started running on 1 Jun 2026",
      "Brand", "Sponsored",
      "From the pitch to the street.",
      "ADIDAS.CO.UK", "Born from sport", "Shop now",
    ].join("\n");
    const ad = parseAdCardText(card, 0);
    expect(ad.cta).toBe("Shop Now");
  });

  it("recognizes app-install CTAs (Install now)", () => {
    const card = [
      "Active", "Library ID: 333", "Started running on 1 Jun 2026",
      "Puma", "Sponsored",
      "Early Access and much more are waiting for you on the PUMA App",
      "PLAY.GOOGLE.COM", "PUMA APP", "Install now",
    ].join("\n");
    const ad = parseAdCardText(card, 0);
    expect(ad.cta).toBe("Install Now");
    // caption must stop at the link-card domain line
    expect(ad.body).toBe("Early Access and much more are waiting for you on the PUMA App");
    expect(ad.body).not.toContain("PLAY.GOOGLE.COM");
    expect(ad.body).not.toContain("PUMA APP");
  });

  it("cuts caption at video scrubber line and flags Video format", () => {
    const card = [
      "Active", "Library ID: 444", "Started running on 1 Jun 2026",
      "Originals", "Sponsored",
      "Do terreno de jogo para as ruas.",
      "0:00 / 0:06", "ADIDAS.PT", "Shop now",
    ].join("\n");
    const ad = parseAdCardText(card, 0);
    expect(ad.body).toBe("Do terreno de jogo para as ruas.");
    expect(ad.format).toBe("Video");
    expect(ad.cta).toBe("Shop Now");
  });

  it("reports no platforms when the card text reveals none (no fabricated 50/50)", () => {
    const card = "Active\nLibrary ID: 555\nStarted running on 1 Jan 2026\nSponsored\nMerhaba";
    expect(parseAdCardText(card, 0).platforms).toEqual([]);
  });

  it("detects video format from timestamp", () => {
    const card = enCard + "\n0:00 / 0:23";
    expect(parseAdCardText(card, 0).format).toBe("Video");
  });
});

describe("aggregateBrandStats", () => {
  it("buckets monthly trend by parsed start dates and skips invalid ones", () => {
    const mk = (startDate: string): AdData => ({
      id: "a",
      libraryId: "1",
      body: "x",
      startDate,
      daysRunning: 0,
      cta: "Belirsiz",
      platforms: ["Facebook"],
      format: "Video",
      libraryUrl: "",
    });
    const stats = aggregateBrandStats([mk("20 Nis 2026"), mk("3 Apr 2026"), mk("bozuk tarih")]);
    expect(stats.monthlyTrend["2026-04"]).toBe(2);
    expect(Object.values(stats.monthlyTrend).reduce((a, b) => a + b, 0)).toBe(2);
    expect(stats.videoCount).toBe(3);
  });
});
