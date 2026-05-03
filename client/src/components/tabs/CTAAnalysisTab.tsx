import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CTAAnalysisTab({ data }: any) {
  const tableData = data.ctaAnalysis.table;
  const insights = data.ctaAnalysis;

  return (
    <div className="space-y-6">
      <Card className="bg-white overflow-x-auto">
        <CardHeader>
          <CardTitle>CTA Karşılaştırması</CardTitle>
          <CardDescription>
            Her markanın kullandığı Call-to-Action butonları ("Shop Now" hariç)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">CTA Türü</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Lululemon
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      Birdiejay
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900" />
                      Oysho
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any) => (
                  <tr key={row.cta} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{row.cta}</td>
                    <td className="py-3 px-4 text-center">
                      {row.lululemon > 0 ? (
                        <Badge className="bg-green-100 text-green-800">{row.lululemon}</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.birdiejay > 0 ? (
                        <Badge className="bg-pink-100 text-pink-800">{row.birdiejay}</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.oysho > 0 ? (
                        <Badge className="bg-slate-200 text-slate-900">{row.oysho}</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["lululemon", "birdiejay", "oysho"].map((brand) => {
          const brandData = data.brandInfo[brand];
          return (
            <Card key={brand} className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: brandData.color }}
                  />
                  {brandData.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {insights[brand]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Key Findings */}
      <Card className="bg-blue-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Önemli Bulgular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>1. Lululemon'un Strateji:</strong> Uygulamaya yönlendirme (Install Now) ana hedefidir. Reklam setinin %29'u bu CTA'yı kullanmakta ve ilk alışverişte %10 indirim sunmaktadır.
          </p>
          <p>
            <strong>2. Birdiejay'in Strateji:</strong> E-ticaret dönüşümüne odaklanmıştır. "Order now" CTA'sı tüm reklamlarda kullanılmakta ve mevsimsel indirimler ile agresif fiyatlandırma uygulanmaktadır.
          </p>
          <p>
            <strong>3. Oysho'nun Strateji:</strong> Ürün keşfetme deneyimini teşvik etmektedir. "Watch More" CTA'sı teknik ürün rehberleri ve koleksiyon lansmanlarında kullanılmaktadır.
          </p>
          <p>
            <strong>4. Ortak Bulgu:</strong> Tüm markalar "Shop Now" CTA'sından kaçınmakta, bunun yerine daha spesifik ve hedefli eylemler tercih etmektedir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
