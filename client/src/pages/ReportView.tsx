import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdData {
  id: string;
  libraryId: string;
  body: string;
  startDate: string;
  daysRunning: number;
  cta: string;
  platforms: string[];
  format: string;
  libraryUrl: string;
}

interface BrandData {
  name: string;
  color: string;
  url: string;
  brandName: string;
  pageId: string;
  totalAds: number;
  ads: AdData[];
  platformCounts: Record<string, number>;
  videoCount: number;
  staticCount: number;
  ctaCounts: Record<string, number>;
  monthlyTrend: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMonth(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ComparisonTab({ brands }: { brands: BrandData[] }) {
  const barData = brands.map((b) => ({
    name: b.name,
    "Toplam Reklam": b.totalAds,
    Video: b.videoCount,
    Görsel: b.staticCount,
  }));

  const radarData = [
    {
      subject: "Toplam Reklam",
      ...Object.fromEntries(brands.map((b) => [b.name, b.totalAds])),
    },
    {
      subject: "Video",
      ...Object.fromEntries(brands.map((b) => [b.name, b.videoCount])),
    },
    {
      subject: "Görsel",
      ...Object.fromEntries(brands.map((b) => [b.name, b.staticCount])),
    },
    {
      subject: "Platform Çeşitliliği",
      ...Object.fromEntries(
        brands.map((b) => [b.name, Object.values(b.platformCounts).filter((v) => v > 0).length])
      ),
    },
    {
      subject: "CTA Çeşitliliği",
      ...Object.fromEntries(brands.map((b) => [b.name, Object.keys(b.ctaCounts).length])),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Reklam Sayısı Karşılaştırması</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Toplam Reklam" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Video" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Görsel" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Çok Boyutlu Karşılaştırma</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            {brands.map((b) => (
              <Radar
                key={b.name}
                name={b.name}
                dataKey={b.name}
                stroke={b.color}
                fill={b.color}
                fillOpacity={0.2}
              />
            ))}
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {brands.map((b) => (
          <div
            key={b.name}
            className="bg-white rounded-xl p-5 shadow-sm border-l-4"
            style={{ borderLeftColor: b.color }}
          >
            <h4 className="font-bold text-slate-900 text-lg">{b.name}</h4>
            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Toplam Reklam</span>
                <span className="font-semibold text-slate-900">{b.totalAds}</span>
              </div>
              <div className="flex justify-between">
                <span>Video</span>
                <span className="font-semibold text-slate-900">{b.videoCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Görsel/Carousel</span>
                <span className="font-semibold text-slate-900">{b.staticCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformsTab({ brands }: { brands: BrandData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((b) => {
        const data = Object.entries(b.platformCounts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value }));
        const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899"];
        return (
          <div
            key={b.name}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
          >
            <h4
              className="font-semibold text-slate-800 mb-4 pb-2 border-b-2"
              style={{ borderColor: b.color }}
            >
              {b.name}
            </h4>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-8 text-sm">Platform verisi yok</div>
            )}
            <div className="mt-2 space-y-1">
              {data.map(({ name, value }, i) => (
                <div key={name} className="flex justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    {name}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyTrendsTab({ brands }: { brands: BrandData[] }) {
  // Collect all months
  const allMonths = Array.from(
    new Set(brands.flatMap((b) => Object.keys(b.monthlyTrend)))
  ).sort();

  const data = allMonths.map((month) => ({
    month: formatMonth(month),
    ...Object.fromEntries(brands.map((b) => [b.name, b.monthlyTrend[month] || 0])),
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-800 mb-4">Aylık Reklam Trendi</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {brands.map((b) => (
              <Line
                key={b.name}
                type="monotone"
                dataKey={b.name}
                stroke={b.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-slate-400 py-12">Trend verisi yok</div>
      )}
    </div>
  );
}

function AdDurationTab({ brands }: { brands: BrandData[] }) {
  return (
    <div className="space-y-6">
      {brands.map((b) => {
        const topAds = [...b.ads]
          .sort((a, z) => z.daysRunning - a.daysRunning)
          .slice(0, 10);
        return (
          <div key={b.name} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h4
              className="font-semibold text-slate-800 mb-4 pb-2 border-b-2"
              style={{ borderColor: b.color }}
            >
              {b.name} — En Uzun Süren Reklamlar
            </h4>
            {topAds.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                      <th className="pb-2 pr-4">Library ID</th>
                      <th className="pb-2 pr-4">Başlangıç</th>
                      <th className="pb-2 pr-4">Süre (gün)</th>
                      <th className="pb-2 pr-4">CTA</th>
                      <th className="pb-2">İçerik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAds.map((ad) => (
                      <tr key={ad.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 pr-4">
                          <a
                            href={ad.libraryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline font-mono text-xs"
                          >
                            {ad.libraryId}
                          </a>
                        </td>
                        <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{ad.startDate}</td>
                        <td className="py-2 pr-4">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: b.color }}
                          >
                            {ad.daysRunning} gün
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-600">{ad.cta}</td>
                        <td className="py-2 text-slate-600 max-w-xs truncate">{ad.body}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-6 text-sm">Reklam verisi yok</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CTAAnalysisTab({ brands }: { brands: BrandData[] }) {
  const allCTAs = Array.from(new Set(brands.flatMap((b) => Object.keys(b.ctaCounts))));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 overflow-x-auto">
        <h3 className="font-semibold text-slate-800 mb-4">CTA Karşılaştırma Tablosu</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="pb-2 pr-6">CTA</th>
              {brands.map((b) => (
                <th key={b.name} className="pb-2 pr-6">
                  <span
                    className="px-2 py-0.5 rounded-full text-white text-xs"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allCTAs.map((cta) => (
              <tr key={cta} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 pr-6 font-medium text-slate-700">{cta}</td>
                {brands.map((b) => (
                  <td key={b.name} className="py-2 pr-6 text-slate-600">
                    {b.ctaCounts[cta] || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((b) => {
          const topCTA = Object.entries(b.ctaCounts).sort((a, z) => z[1] - a[1])[0];
          return (
            <div
              key={b.name}
              className="bg-white rounded-xl p-5 shadow-sm border-l-4"
              style={{ borderLeftColor: b.color }}
            >
              <h4 className="font-semibold text-slate-800">{b.name}</h4>
              <p className="text-xs text-slate-500 mt-1">En çok kullanılan CTA</p>
              <p className="text-2xl font-bold mt-2" style={{ color: b.color }}>
                {topCTA ? topCTA[0] : "—"}
              </p>
              {topCTA && (
                <p className="text-xs text-slate-500 mt-1">{topCTA[1]} reklamda kullanılmış</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdExamplesTab({ brands }: { brands: BrandData[] }) {
  return (
    <div className="space-y-6">
      {brands.map((b) => (
        <div key={b.name} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h4
            className="font-semibold text-slate-800 mb-4 pb-2 border-b-2"
            style={{ borderColor: b.color }}
          >
            {b.name} — Reklam Örnekleri
          </h4>
          {b.ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {b.ads.slice(0, 10).map((ad) => (
                <div
                  key={ad.id}
                  className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: b.color }}
                    >
                      {ad.cta}
                    </span>
                    <a
                      href={ad.libraryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline font-mono shrink-0"
                    >
                      #{ad.libraryId}
                    </a>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{ad.body}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                    <span>{ad.startDate}</span>
                    <span>{ad.daysRunning} gün</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-6 text-sm">Reklam verisi yok</div>
          )}
        </div>
      ))}
    </div>
  );
}

function RecommendationsTab({ brands }: { brands: BrandData[] }) {
  const topBrand = [...brands].sort((a, z) => z.totalAds - a.totalAds)[0];
  const mostVideoBrand = [...brands].sort((a, z) => z.videoCount - a.videoCount)[0];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Temel Bulgular</h3>
        <div className="space-y-3">
          {topBrand && (
            <div className="flex gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div
                className="w-1 rounded-full shrink-0"
                style={{ backgroundColor: topBrand.color }}
              />
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{topBrand.name}</span>, {topBrand.totalAds} aktif
                reklam ile en yüksek reklam hacmine sahip marka.
              </p>
            </div>
          )}
          {mostVideoBrand && mostVideoBrand.videoCount > 0 && (
            <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div
                className="w-1 rounded-full shrink-0"
                style={{ backgroundColor: mostVideoBrand.color }}
              />
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{mostVideoBrand.name}</span>, {mostVideoBrand.videoCount}{" "}
                video reklamla video içeriğe en çok yatırım yapan marka.
              </p>
            </div>
          )}
          {brands.map((b) => {
            const topCTA = Object.entries(b.ctaCounts).sort((a, z) => z[1] - a[1])[0];
            if (!topCTA) return null;
            return (
              <div key={b.name} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{b.name}</span> en çok{" "}
                  <span className="font-semibold">"{topCTA[0]}"</span> CTA'sını kullanıyor (
                  {topCTA[1]} reklam).
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Stratejik Öneriler</h3>
        <div className="space-y-3">
          {[
            "Video içerik oranını artırın — video reklamlar genellikle daha yüksek etkileşim sağlar.",
            "Rakiplerin uzun süre yayında kalan reklamlarını inceleyin — bunlar en iyi performans gösteren içeriklerdir.",
            "Farklı CTA'ları A/B test edin — rakiplerin kullandığı CTA'ları kendi stratejinizle karşılaştırın.",
            "Platforma özgü içerik üretin — Instagram ve Facebook için ayrı formatlar deneyin.",
            "Mevsimsel trendleri takip edin — aylık trend grafiğine göre reklam bütçenizi optimize edin.",
          ].map((rec, i) => (
            <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center shrink-0 font-bold">
                {i + 1}
              </span>
              <p className="text-sm text-slate-700">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportView() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  const { data: report, isLoading, error } = trpc.reports.getByShareToken.useQuery(
    shareToken ?? "",
    { enabled: !!shareToken }
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link kopyalandı!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Rapor bulunamadı</p>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // Parse report data — normalize old and new scraper formats
  const rawData = report.reportData as Record<string, any>;
  const brands: BrandData[] = Object.values(rawData).map((b: any) => ({
    name: b.name || b.brandName || "Unknown",
    color: b.color || "#10b981",
    url: b.url || "",
    brandName: b.brandName || b.name || "Unknown",
    pageId: b.pageId || "",
    totalAds: b.totalAds || 0,
    ads: (b.ads || []).map((ad: any) => ({
      id: ad.id || "",
      libraryId: ad.libraryId || ad.id || "",
      body: ad.body || ad.title || "",
      startDate: ad.startDate || "",
      daysRunning: ad.daysRunning ?? ad.days ?? 0,
      cta: ad.cta || "Shop Now",
      platforms: ad.platforms || ["Facebook", "Instagram"],
      format: ad.format || "Image",
      libraryUrl: ad.libraryUrl || (ad.libraryId ? `https://www.facebook.com/ads/library/?id=${ad.libraryId}` : ""),
    })),
    platformCounts: b.platformCounts || b.platforms || { Facebook: 0, Instagram: 0, Messenger: 0, "Audience Network": 0 },
    videoCount: b.videoCount || 0,
    staticCount: b.staticCount || 0,
    ctaCounts: b.ctaCounts || {},
    monthlyTrend: b.monthlyTrend || {},
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/")}
              className="gap-1.5 text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{report.reportName}</h1>
              <p className="text-xs text-slate-500">
                {new Date(report.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {brands.length} marka
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1.5">
              {brands.map((b) => (
                <span
                  key={b.name}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: b.color }}
                >
                  {b.name}
                </span>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 ml-2"
            >
              <Copy className="w-3.5 h-3.5" />
              Paylaş
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="container py-6">
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6 bg-white border border-slate-200 p-1 rounded-lg h-auto gap-1">
            {[
              { value: "comparison", label: "Karşılaştırma" },
              { value: "platforms", label: "Platformlar" },
              { value: "monthly", label: "Aylık Trend" },
              { value: "duration", label: "Süre" },
              { value: "cta", label: "CTA Analizi" },
              { value: "examples", label: "Örnekler" },
              { value: "recommendations", label: "Öneriler" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs py-1.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="comparison">
            <ComparisonTab brands={brands} />
          </TabsContent>
          <TabsContent value="platforms">
            <PlatformsTab brands={brands} />
          </TabsContent>
          <TabsContent value="monthly">
            <MonthlyTrendsTab brands={brands} />
          </TabsContent>
          <TabsContent value="duration">
            <AdDurationTab brands={brands} />
          </TabsContent>
          <TabsContent value="cta">
            <CTAAnalysisTab brands={brands} />
          </TabsContent>
          <TabsContent value="examples">
            <AdExamplesTab brands={brands} />
          </TabsContent>
          <TabsContent value="recommendations">
            <RecommendationsTab brands={brands} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
