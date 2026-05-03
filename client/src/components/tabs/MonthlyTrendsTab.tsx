import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonthlyTrendsTab({ data }: any) {
  const brands = ["lululemon", "birdiejay", "oysho"];

  // Combine all months
  const allMonths = new Set<string>();
  brands.forEach((brand) => {
    data.monthlyTrends[brand].forEach((item: any) => {
      allMonths.add(item.month);
    });
  });

  const sortedMonths = Array.from(allMonths).sort();
  const combinedData = sortedMonths.map((month) => {
    const obj: any = { month };
    brands.forEach((brand) => {
      const found = data.monthlyTrends[brand].find((item: any) => item.month === month);
      obj[brand] = found ? found.count : 0;
    });
    return obj;
  });

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Aylık Yeni Reklam Sayısı Trendi</CardTitle>
          <CardDescription>Her ay eklenen yeni reklam kampanyalarının sayısı</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="lululemon"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="birdiejay"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ fill: "#ec4899" }}
              />
              <Line
                type="monotone"
                dataKey="oysho"
                stroke="#1f2937"
                strokeWidth={2}
                dot={{ fill: "#1f2937" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {brands.map((brand) => {
          const brandData = data.brandInfo[brand];
          const trends = data.monthlyTrends[brand];
          const totalAds = trends.reduce((sum: number, item: any) => sum + item.count, 0);

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
              </CardHeader>
              <CardContent className="space-y-3">
                {trends.map((trend: any) => (
                  <div key={trend.month} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{trend.month}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: brandData.color,
                          width: `${Math.max(trend.count * 15, 20)}px`,
                        }}
                      />
                      <span className="text-sm font-semibold w-6 text-right">{trend.count}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 mt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-slate-900">Toplam</span>
                    <span className="text-sm font-bold" style={{ color: brandData.color }}>
                      {totalAds}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
