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
