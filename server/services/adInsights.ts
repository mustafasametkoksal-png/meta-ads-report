import type { BrandAdsData } from "./metaAdsScraper";

/**
 * AI insight layer — sends scraped captions to the Anthropic API and gets back
 * a structured Turkish analysis: per-brand angles & hooks, key insights, and
 * strategic recommendations.
 *
 * Fully optional: when ANTHROPIC_API_KEY is not set (or the call fails for any
 * reason) the function resolves to null and report creation continues without
 * the insights block.
 */

export interface BrandInsight {
  angles: { name: string; count: number; example?: string }[];
  hooks: { name: string; count: number }[];
  tone: string;
}

export interface ReportInsights {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  brands: Record<string, BrandInsight>;
  generatedAt: string;
  model: string;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 90_000;

function buildPrompt(brands: BrandAdsData[]): string {
  const brandBlocks = brands
    .map((b) => {
      const adLines = b.ads
        .slice(0, 20)
        .map((ad, i) => {
          const caption = (ad.body || "").replace(/\s+/g, " ").slice(0, 320);
          return `${i + 1}. [${ad.format} | CTA: ${ad.cta} | ${ad.daysRunning} gündür yayında] ${caption}`;
        })
        .join("\n");
      return `### Marka: ${b.brandName} (kaynak: ${b.source}, analiz edilen reklam: ${b.totalAds}${
        b.reportedTotal ? `, kütüphane toplamı ≈${b.reportedTotal}` : ""
      })\n${adLines}`;
    })
    .join("\n\n");

  return `Aşağıda rakip markaların reklam kütüphanelerinden çekilmiş reklam verileri var. Her reklam için format, CTA, yayında kalma süresi ve caption metni veriliyor. Uzun süredir yayında olan reklamlar büyük olasılıkla iyi performans gösteren (kanıtlanmış) kreatiflerdir — analizinde bunu ağırlıklandır.

${brandBlocks}

Görevin: Bu verilerden bir performans pazarlama stratejistinin çıkaracağı içgörüleri üretmek.

Her marka için:
- "angles": Kullanılan reklam açılarını sınıflandır (örn: indirim/fiyat, sosyal kanıt, ürün özelliği, lifestyle, UGC, problem-çözüm, yenilik/lansman, marka hikayesi). Her açı için kaç reklamda kullanıldığını ve kısa bir örnek caption parçası (max 80 karakter) ver.
- "hooks": Caption açılış hook tiplerini sınıflandır (örn: soru, iddia, rakam/istatistik, merak uyandırma, doğrudan teklif, hitap). Sayılarıyla.
- "tone": Markanın dil/ton özetini 1 cümlede yaz.

Rapor geneli için:
- "summary": Tüm raporun 1-2 cümlelik yönetici özeti.
- "keyInsights": 4-6 maddelik, markalar arası karşılaştırmalı, SOMUT bulgular (sayı referanslı).
- "recommendations": Bu rakip verisine bakan bir markanın yapması gereken 4-6 somut, uygulanabilir aksiyon. Genel geçer tavsiye değil; veriye dayalı ("X markası fiyat açısını hiç kullanmıyor → fırsat" gibi).

Tüm çıktı Türkçe olacak. SADECE aşağıdaki şemada geçerli bir JSON döndür, başka hiçbir şey yazma (markdown code fence de yazma):

{
  "summary": "...",
  "keyInsights": ["..."],
  "recommendations": ["..."],
  "brands": {
    "<marka adı>": {
      "angles": [{"name": "...", "count": 0, "example": "..."}],
      "hooks": [{"name": "...", "count": 0}],
      "tone": "..."
    }
  }
}`;
}

function extractJson(text: string): any {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  // Tolerate stray prose around the JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function generateInsights(brands: BrandAdsData[]): Promise<ReportInsights | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("[Insights] ANTHROPIC_API_KEY not set — skipping AI insights");
    return null;
  }
  if (brands.length === 0 || brands.every((b) => b.ads.length === 0)) return null;

  const model = process.env.INSIGHTS_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system:
          "Sen kıdemli bir performans pazarlama stratejistisin. Meta ve TikTok reklam kütüphanesi verilerinden rakip istihbaratı çıkarırsın. Çıktıların her zaman geçerli JSON olur.",
        messages: [{ role: "user", content: buildPrompt(brands) }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(`[Insights] API error ${response.status}: ${errBody.slice(0, 300)}`);
      return null;
    }

    const data = (await response.json()) as any;
    const text = (data.content || [])
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");

    const parsed = extractJson(text);
    if (!parsed.summary || !Array.isArray(parsed.keyInsights)) {
      console.error("[Insights] Unexpected JSON shape — skipping");
      return null;
    }

    return {
      summary: String(parsed.summary),
      keyInsights: (parsed.keyInsights as any[]).map(String),
      recommendations: Array.isArray(parsed.recommendations)
        ? (parsed.recommendations as any[]).map(String)
        : [],
      brands: parsed.brands && typeof parsed.brands === "object" ? parsed.brands : {},
      generatedAt: new Date().toISOString(),
      model,
    };
  } catch (error) {
    console.error("[Insights] Failed:", (error as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
