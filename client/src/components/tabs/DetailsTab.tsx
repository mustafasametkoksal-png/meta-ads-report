import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function DetailsTab({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["lululemon", "birdiejay", "oysho"].map((brand) => {
          const brandData = data.brandInfo[brand];
          const details = data.details[brand];
          return (
            <Card key={brand} className="bg-white overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: brandData.color }}
              />
              <CardHeader>
                <CardTitle className="text-xl">{brandData.name}</CardTitle>
                <CardDescription>Türkiye Pazarı - Meta Ads Stratejisi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-1">Aktif Reklamlar</h4>
                  <p className="text-2xl font-bold" style={{ color: brandData.color }}>
                    {details.active_ads}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-2">Ana Mesaj</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {details.main_message}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-2">Stratejik Yaklaşımlar</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {details.strategy}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.open(brandData.libraryLink, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Meta Ads Library'de Gör
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
