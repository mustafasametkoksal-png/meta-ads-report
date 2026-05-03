import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp } from "lucide-react";

export default function AdExamplesTab({ data }: any) {
  const brands = ["lululemon", "birdiejay", "oysho"];

  return (
    <div className="space-y-8">
      {brands.map((brand) => {
        const brandData = data.brandInfo[brand];
        const examples = data.adDuration[brand].slice(0, 3); // Top 3 longest running

        return (
          <div key={brand}>
            <div className="mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: brandData.color }}
                />
                {brandData.name} - En Başarılı Reklam Örnekleri
              </h3>
              <p className="text-sm text-slate-600 mt-1">En uzun süreli kampanyalardan seçilmiş</p>
            </div>

            <div className="space-y-4">
              {examples.map((ad: any, idx: number) => (
                <Card key={ad.id} className="bg-white overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: brandData.color }}
                        >
                          {idx + 1}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            style={{
                              backgroundColor: brandData.color,
                              color: "white",
                            }}
                            className="text-xs"
                          >
                            {ad.format}
                          </Badge>
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {ad.days} gün
                          </Badge>
                        </div>

                        <h4 className="font-semibold text-base mb-2">{ad.title}</h4>

                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          <div>
                            <span className="text-slate-600">Ürün:</span>
                            <p className="font-medium text-slate-900">{ad.product}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Başlangıç Tarihi:</span>
                            <p className="font-medium text-slate-900">{ad.startDate}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="text-sm text-slate-600">Platformlar:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ad.platforms.map((p: string) => (
                              <Badge key={p} variant="outline" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=TR&is_targeted_country=false&media_type=all&q=${ad.id}&search_type=keyword_unordered&sort_data[direction]=desc&sort_data[mode]=total_impressions`;
                            window.open(url, "_blank");
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Meta Ads Library'de Gör
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
