import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { adsData } from "@/data/adsData";
import ComparisonTab from "@/components/tabs/ComparisonTab";
import DetailsTab from "@/components/tabs/DetailsTab";
import AdDurationTab from "@/components/tabs/AdDurationTab";
import MonthlyTrendsTab from "@/components/tabs/MonthlyTrendsTab";
import PlatformsTab from "@/components/tabs/PlatformsTab";
import AdExamplesTab from "@/components/tabs/AdExamplesTab";
import CTAAnalysisTab from "@/components/tabs/CTAAnalysisTab";
import RecommendationsTab from "@/components/tabs/RecommendationsTab";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const handleDownload = () => {
    const reportData = JSON.stringify(adsData, null, 2);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(reportData));
    element.setAttribute("download", "meta-ads-report-TR.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Meta Ads Analysis Report - TR Market",
        text: "Lululemon, Birdiejay ve Oysho'nun Türkiye pazarındaki Meta Ads stratejilerinin detaylı analizi.",
        url: window.location.href,
      });
    } else {
      const url = window.location.href;
      const text = `Meta Ads Analysis Report - TR Market: ${url}`;
      navigator.clipboard.writeText(text);
      alert("Link panoya kopyalandı!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Meta Ads Analiz Raporu</h1>
              <p className="text-slate-600 mt-1">Türkiye Pazarı - Lululemon, Birdiejay, Oysho</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                İndir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Paylaş
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-8 bg-white border border-slate-200 p-1 rounded-lg">
            <TabsTrigger value="comparison" className="text-xs sm:text-sm">Karşılaştırma</TabsTrigger>
            <TabsTrigger value="details" className="text-xs sm:text-sm">Detaylar</TabsTrigger>
            <TabsTrigger value="duration" className="text-xs sm:text-sm">Reklam Süresi</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">Aylık Trend</TabsTrigger>
            <TabsTrigger value="platforms" className="text-xs sm:text-sm">Platformlar</TabsTrigger>
            <TabsTrigger value="examples" className="text-xs sm:text-sm">Örnekler</TabsTrigger>
            <TabsTrigger value="cta" className="text-xs sm:text-sm">CTA Analizi</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm">Öneriler</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="tab-content">
            <ComparisonTab data={adsData} />
          </TabsContent>

          <TabsContent value="details" className="tab-content">
            <DetailsTab data={adsData} />
          </TabsContent>

          <TabsContent value="duration" className="tab-content">
            <AdDurationTab data={adsData} />
          </TabsContent>

          <TabsContent value="monthly" className="tab-content">
            <MonthlyTrendsTab data={adsData} />
          </TabsContent>

          <TabsContent value="platforms" className="tab-content">
            <PlatformsTab data={adsData} />
          </TabsContent>

          <TabsContent value="examples" className="tab-content">
            <AdExamplesTab data={adsData} />
          </TabsContent>

          <TabsContent value="cta" className="tab-content">
            <CTAAnalysisTab data={adsData} />
          </TabsContent>

          <TabsContent value="recommendations" className="tab-content">
            <RecommendationsTab data={adsData} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 mt-16">
        <div className="container text-center">
          <p className="text-sm">Meta Ads Library Analiz Raporu | Türkiye Pazarı | Nisan 2026</p>
        </div>
      </footer>
    </div>
  );
}
