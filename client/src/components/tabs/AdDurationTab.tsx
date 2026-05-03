import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export default function AdDurationTab({ data }: any) {
  const brands = ["lululemon", "birdiejay", "oysho"];

  const getPlatformBadges = (platforms: string[]) => {
    const platformNames: Record<string, string> = {
      FB: "Facebook",
      IG: "Instagram",
      MSG: "Messenger",
      AN: "Audience Network",
    };
    return platforms.map((p) => platformNames[p] || p);
  };

  return (
    <div className="space-y-8">
      {brands.map((brand) => {
        const brandData = data.brandInfo[brand];
        const ads = data.adDuration[brand];

        return (
          <div key={brand}>
            <div className="mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: brandData.color }}
                />
                {brandData.name} - En Uzun Süreli 10 Reklam
              </h3>
            </div>

            <div className="grid gap-4">
              {ads.map((ad: any) => (
                <Card key={ad.id} className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            #{ad.rank}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {ad.format}
                          </Badge>
                          <span className="text-xs font-medium text-slate-600">
                            {ad.days} gün
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{ad.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">
                          <strong>Ürün:</strong> {ad.product}
                        </p>
                        <p className="text-sm text-slate-600 mb-3">
                          <strong>Başlangıç:</strong> {ad.startDate}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {getPlatformBadges(ad.platforms).map((platform) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 flex-shrink-0"
                        onClick={() => {
                          const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=TR&is_targeted_country=false&media_type=all&q=${ad.id}&search_type=keyword_unordered&sort_data[direction]=desc&sort_data[mode]=total_impressions`;
                          window.open(url, "_blank");
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Görüntüle
                      </Button>
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
