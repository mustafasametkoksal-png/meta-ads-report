import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComparisonTab({ data }: any) {
  const barData = [
    { name: "Lululemon", value: data.comparison.activeAds.lululemon, fill: "#10b981" },
    { name: "Birdiejay", value: data.comparison.activeAds.birdiejay, fill: "#ec4899" },
    { name: "Oysho", value: data.comparison.activeAds.oysho, fill: "#1f2937" },
  ];

  const radarData = [
    {
      category: "Reklam Sayısı",
      lululemon: (data.comparison.radar.lululemon.adsCount / 17) * 100,
      birdiejay: (data.comparison.radar.birdiejay.adsCount / 17) * 100,
      oysho: (data.comparison.radar.oysho.adsCount / 17) * 100,
    },
    {
      category: "Ort. Süre (gün)",
      lululemon: Math.min((data.comparison.radar.lululemon.avgDuration / 50) * 100, 100),
      birdiejay: Math.min((data.comparison.radar.birdiejay.avgDuration / 50) * 100, 100),
      oysho: Math.min((data.comparison.radar.oysho.avgDuration / 50) * 100, 100),
    },
    {
      category: "Platform Çeşitliliği",
      lululemon: (data.comparison.radar.lululemon.platformDiversity / 4) * 100,
      birdiejay: (data.comparison.radar.birdiejay.platformDiversity / 4) * 100,
      oysho: (data.comparison.radar.oysho.platformDiversity / 4) * 100,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Aktif Reklam Sayısı</CardTitle>
          <CardDescription>Her marka için aktif reklam kampanyalarının sayısı</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Çok Boyutlu Karşılaştırma</CardTitle>
          <CardDescription>Reklam sayısı, ortalama süre ve platform çeşitliliği</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Lululemon" dataKey="lululemon" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Radar name="Birdiejay" dataKey="birdiejay" stroke="#ec4899" fill="#ec4899" fillOpacity={0.25} />
              <Radar name="Oysho" dataKey="oysho" stroke="#1f2937" fill="#1f2937" fillOpacity={0.25} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["lululemon", "birdiejay", "oysho"].map((brand) => {
          const brandData = data.brandInfo[brand];
          const radar = data.comparison.radar[brand];
          return (
            <Card key={brand} className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: brandData.color }}
                  />
                  {brandData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Aktif Reklamlar:</span>
                  <span className="font-semibold">{radar.adsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ort. Süre:</span>
                  <span className="font-semibold">{radar.avgDuration} gün</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Platform Sayısı:</span>
                  <span className="font-semibold">{radar.platformDiversity}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
