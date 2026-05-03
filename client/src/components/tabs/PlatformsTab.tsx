import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformsTab({ data }: any) {
  const brands = ["lululemon", "birdiejay", "oysho"];
  const platformNames: Record<string, string> = {
    FB: "Facebook",
    IG: "Instagram",
    MSG: "Messenger",
    AN: "Audience Network",
  };

  const platformColors: Record<string, string> = {
    FB: "#1877F2",
    IG: "#E4405F",
    MSG: "#00B2FF",
    AN: "#A4A4A4",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {brands.map((brand) => {
          const brandData = data.brandInfo[brand];
          const platformData = data.platforms[brand];

          const chartData = Object.entries(platformData).map(([key, value]) => ({
            name: platformNames[key] || key,
            value: value as number,
            fill: platformColors[key] || "#999",
          }));

          return (
            <Card key={brand} className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: brandData.color }}
                  />
                  {brandData.name}
                </CardTitle>
                <CardDescription>Platform Dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {chartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Platform Analizi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Platform Açıklamaları</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <strong>Facebook (FB):</strong> Geleneksel sosyal medya platformu, geniş yaş aralığında kullanıcı tabanı
              </li>
              <li>
                <strong>Instagram (IG):</strong> Görsel içerik odaklı platform, genç demografiye yönelik
              </li>
              <li>
                <strong>Messenger (MSG):</strong> Doğrudan mesajlaşma platformu, kişiselleştirilmiş iletişim
              </li>
              <li>
                <strong>Audience Network (AN):</strong> Meta'nın üçüncü taraf uygulamalarında reklam ağı
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-semibold text-sm mb-2">Bulgular</h4>
            <p className="text-sm text-slate-600">
              Tüm markalar 4 platformda da aktif olarak reklamcılık yapmaktadır. Bu, Meta'nın çeşitli platformlarında geniş bir kitleye ulaşma stratejisini göstermektedir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
