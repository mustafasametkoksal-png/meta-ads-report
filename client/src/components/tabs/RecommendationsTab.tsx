import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, Target, Lightbulb } from "lucide-react";

export default function RecommendationsTab({ data }: any) {
  const keyInsights = data.recommendations.keyInsights;
  const strategicRecommendations = data.recommendations.strategicRecommendations;

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Temel İçgörüler
          </CardTitle>
          <CardDescription>Türkiye pazarında Meta Ads stratejilerinin ana bulguları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {keyInsights.map((insight: string, idx: number) => (
            <div key={idx} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {idx + 1}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Stratejik Öneriler
          </CardTitle>
          <CardDescription>Her marka için özelleştirilmiş tavsiyeleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategicRecommendations.map((rec: string, idx: number) => (
            <div key={idx} className="border-l-4 border-amber-400 pl-4 py-2">
              <p className="text-sm text-slate-700 leading-relaxed">{rec}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Brand-Specific Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["lululemon", "birdiejay", "oysho"].map((brand) => {
          const brandData = data.brandInfo[brand];
          const strategies = {
            lululemon: {
              title: "Lululemon - Mobil-First Stratejisi",
              points: [
                "Uygulamaya yönlendirme (%29 Install Now CTA)",
                "İlk alışverişte %10 indirim teşviki",
                "Ürün-spesifik vurgular (Wunder Train Tayt)",
                "Yaşam tarzı entegrasyonu",
                "Kısa kampanya süresi (ortalama 15.2 gün)",
              ],
            },
            birdiejay: {
              title: "Birdiejay - Influencer & Video Stratejisi",
              points: [
                "Influencer-led içerik (%53 video oranı)",
                "Agresif indirim mesajlaşması",
                "Mevsimsel koleksiyon lansmanları",
                "E-ticaret dönüşümüne odaklanma",
                "Uzun kampanya süresi (ortalama 47.6 gün)",
              ],
            },
            oysho: {
              title: "Oysho - Teknik Ürün Odağı",
              points: [
                "Teknik ürün rehberleri",
                "Mevsimsel koleksiyon lansmanları",
                "En çok satan ürün vurgusu",
                "Ürün keşfetme deneyimi",
                "En uzun kampanya süresi (ortalama 201.5 gün)",
              ],
            },
          };

          const strategy = strategies[brand as keyof typeof strategies];

          return (
            <Card key={brand} className="bg-white">
              <div
                className="h-2"
                style={{ backgroundColor: brandData.color }}
              />
              <CardHeader>
                <CardTitle className="text-base">{strategy.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.points.map((point: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-700">
                      <span
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                        style={{ backgroundColor: brandData.color }}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Market Recommendations */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Türkiye Pazarı İçin Genel Öneriler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Platform Stratejisi
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Meta'nın tüm platformlarında (Facebook, Instagram, Messenger, Audience Network) aktif olmak, geniş bir kitleye ulaşmak için kritiktir. Her platform farklı demografiye ve davranışa sahiptir.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Video vs. Statik İçerik</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Birdiejay'in yüksek video oranı (%53) ve uzun kampanya süresi, video içeriğinin Türkiye pazarında etkili olduğunu göstermektedir. Beauty ve lifestyle kategorisinde video, statik görsellere kıyasla daha iyi performans göstermektedir.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CTA Stratejisi</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Genel "Shop Now" CTA'sından kaçınılmakta, bunun yerine daha spesifik eylemler (Install, Order, Watch) tercih edilmektedir. Bu, hedef kitleyi daha iyi segmentleme ve dönüşüm oranlarını artırma stratejisini göstermektedir.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Kampanya Süresi</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Kampanya süresi kategoriye göre değişmektedir. Mobil uygulamalar kısa süreli kampanyalar (15 gün), beauty ve lifestyle ürünleri ise daha uzun süreli kampanyalar (47-200 gün) kullanmaktadır.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
