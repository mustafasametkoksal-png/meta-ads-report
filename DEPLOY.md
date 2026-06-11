# Meta Ads Report — Deploy Rehberi

## Railway ile Deploy (Önerilen)

### 1. Gereksinimler
- [Railway](https://railway.app) hesabı (GitHub ile giriş yapabilirsiniz)
- Bu projeyi GitHub'a push etmiş olmanız

### 2. Adımlar

**a) GitHub'a push edin:**
```bash
cd meta-ads-report
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/KULLANICI_ADINIZ/meta-ads-report.git
git push -u origin main
```

**b) Railway'de yeni proje oluşturun:**
1. https://railway.app adresine gidin
2. "New Project" → "Deploy from GitHub repo" seçin
3. Bu repo'yu seçin

**c) MySQL veritabanı ekleyin:**
1. Railway dashboard'da "+" butonuna tıklayın
2. "Database" → "MySQL" seçin
3. MySQL servisinin "Variables" sekmesinden `DATABASE_URL` değişkenini kopyalayın
4. Ana servisinizin "Variables" sekmesine gidin ve `DATABASE_URL` olarak yapıştırın

**d) Veritabanı tablolarını oluşturun:**
Railway shell'den veya lokal olarak:
```bash
# Railway CLI ile
railway run pnpm db:push
```

Veya MySQL client ile doğrudan SQL'leri çalıştırın:
- `drizzle/0000_material_menace.sql`
- `drizzle/0001_magical_absorbing_man.sql`

**e) Deploy otomatik başlayacaktır.** Birkaç dakika sonra URL'niz hazır olacak.

### 3. Ortam Değişkenleri

| Değişken | Açıklama | Zorunlu |
|----------|----------|---------|
| `DATABASE_URL` | MySQL bağlantı URL'si | Evet |
| `PORT` | Sunucu portu (Railway otomatik atar) | Hayır |
| `PUPPETEER_EXECUTABLE_PATH` | Chrome yolu (Dockerfile'da ayarlı) | Hayır |

### 4. Özel Domain (Opsiyonel)
Railway Settings → Networking → Custom Domain bölümünden kendi domain'inizi ekleyebilirsiniz.

---

## Render ile Deploy (Alternatif)

1. https://render.com → New Web Service → GitHub repo'nuzu bağlayın
2. Environment: Docker
3. `DATABASE_URL` env var ekleyin (harici MySQL gerekir)
4. Deploy

---

## Lokal Geliştirme

```bash
# Bağımlılıkları yükle
pnpm install

# MySQL'in çalıştığından emin ol
export DATABASE_URL="mysql://user:pass@localhost:3306/meta_ads"

# Tabloları oluştur
pnpm db:push

# Dev sunucuyu başlat
pnpm dev
```

Not: Lokal geliştirme için Chrome/Chromium yüklü olmalıdır.


---

## v2 Güncellemesi (Haziran 2026)

### Yeni özellikler
- **Job kuyruğu + canlı ilerleme:** Rapor oluşturma artık kuyruk üzerinden çalışır; arayüzde marka bazlı ilerleme çubuğu gösterilir. Aynı anda tek scrape çalışır (RAM güvenliği + doğal rate limit).
- **Kreatif thumbnail'ları:** Meta reklam kartlarının ekran görüntüsü (JPEG, data-URI) rapora gömülür — fbcdn URL'leri zamanla ölse de rapor bozulmaz. TikTok'ta kütüphanenin kendi thumbnail URL'i kullanılır.
- **AI içgörü katmanı:** `ANTHROPIC_API_KEY` tanımlıysa her rapor için Claude ile açı/hook analizi, temel bulgular ve stratejik öneriler üretilir (Öneriler sekmesi + üstte AI özeti). Key yoksa rapor normal şekilde, AI bloğu olmadan oluşur.
- **PDF export:** Rapor sayfasındaki "PDF" butonu `GET /api/report-pdf/:token` ile A4 PDF üretir (mevcut Chromium kullanılır, ek bağımlılık yok).
- **OG meta tag'leri:** Paylaşılan `/report/:token` linkleri Slack/WhatsApp'ta başlıklı önizleme ile açılır.
- **Güvenlik:** Scrape URL'leri sunucu tarafında facebook.com / library.tiktok.com ile sınırlandı (SSRF koruması). TR/EN locale tarih parsing düzeltildi; tek marka hatası artık tüm raporu düşürmez.

### Ortam değişkenleri
| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | Evet | Railway MySQL bağlantısı |
| `PUPPETEER_EXECUTABLE_PATH` | Hayır | Dockerfile'da `/usr/bin/chromium` olarak set ediliyor |
| `ANTHROPIC_API_KEY` | Hayır | AI içgörüleri için. Yoksa rapor AI'sız oluşur |
| `INSIGHTS_MODEL` | Hayır | Varsayılan: `claude-sonnet-4-6` |

### Yeniden deploy
```bash
git add .
git commit -m "v2: thumbnails, AI insights, job queue, PDF export"
git push
```
Railway push'u algılayıp Dockerfile ile otomatik build alır. Sonrasında ana servisin **Variables** sekmesine `ANTHROPIC_API_KEY` ekleyin (eklediğiniz anda servis yeniden başlar).

### Deploy sonrası doğrulama
1. `/` → 1 markayla rapor başlat, ilerleme çubuğunun aktığını gör.
2. Rapor açıldığında **Örnekler** sekmesinde thumbnail'lar görünüyor mu? (Görünmüyorsa Railway loglarında `[Scraper] Card detection found 0 cards` uyarısını ara — Meta layout değişmiş demektir, eski metin-parse yoluna düşer ama rapor yine oluşur.)
3. **Öneriler** sekmesinde AI analizi var mı? (Yoksa loglarda `[Insights]` satırlarına bak.)
4. **PDF** butonunu test et — ilk PDF ~10-15 sn sürebilir.
