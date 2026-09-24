# CookieExplainer 🍪🛡️
**AI-Powered Privacy Assistant & Autonomous Cookie Blocker**

CookieExplainer, kullanıcıların web sitelerindeki çerez karmaşasından kurtulmasını sağlayan, gizlilik politikalarını yapay zeka ile saniyeler içinde özetleyen ve "Dark Pattern" (karanlık tasarım) çerez tuzaklarını otonom olarak alt eden modern bir Chrome eklentisidir.

## 🚀 Öne Çıkan Özellikler 

*   **🛡️ 3 Aşamalı Otonom Kalkan (Terminator Bot):** Sitelere girdiğinizde sinsi çerez pop-up'larını arka planda yok eder. "Reddet" butonu gizlenmiş olsa bile sırasıyla şu 3 hamleyi yapar:
    1. "Tümünü Reddet" butonunu arar ve vurur.
    2. Bulamazsa, "Sadece Zorunlu Olanları Kabul Et" seçeneğiyle takipçileri bloklar.
    3. Hileli sitelerde (örn. HyperX) "Ayarlar" menüsüne sızıp tercihleri güvenli şekilde kaydeder.
 
*   **🧠 Yapay Zeka Destekli Analiz:** Sayfa metinlerini **Groq API (OpenAI/GPT-OSS-20B)** ile analiz eder. Hukuki ve karmaşık gizlilik metinlerini saniyeler içinde A'dan F'ye kadar skorlayarak basit bir dille özetler.
  
*   **⚡ Kendi Kendini İyileştiren Önbellek (Self-Healing Cache):** Analiz edilen siteler **Supabase (PostgreSQL)** üzerinde 30 gün boyunca saklanır. Aynı siteye tekrar girildiğinde API maliyeti sıfıra iner ve yanıt hızı milisaniyelere düşer. API hatalarında cache kendini otomatik temizler.
  
*   **✨ Yüzen Kart (Floating Card) Arayüzü:** Özel turkuaz tasarım, dinamik ikon animasyonları (Büyüteç ↔ Kalkan dönüşümü), engellenen çerez sayacı ve kullanıcının güvendiği siteler için tek tıkla **Whitelist (Güvenilir Liste)** yönetimi.

## 🛠️ Mimari ve Teknoloji Yığını (Tech Stack)

Proje, frontend ve backend olarak izole edilmiş bir **Monorepo** mimarisine sahiptir:

*   **Frontend (Eklenti):** Manifest V3, HTML5, CSS3, Vanilla JavaScript (ES6+), DOM MutationObserver.
*   **Backend (API):** Python 3.10+, FastAPI, Uvicorn.
*   **Yapay Zeka & Veritabanı:** Groq Cloud (LLM), Supabase (Vector/Postgres).

```text
CookieExplainer/
├── backend/               # FastAPI sunucusu, LLM promptları ve Supabase bağlantısı
│   ├── app/
│   ├── requirements.txt
│   └── .env               # (Git'ten izole edilmiştir)
└── extension/             # Chrome Eklenti dosyaları
    ├── manifest.json
    ├── content.js         # Otonom Saha Ajanı (Pop-up avcısı)
    ├── background.js      # API iletişim işçisi
    └── popup.html / .js   # Kullanıcı Arayüzü
```

## ⚙️ Kurulum ve Çalıştırma (Geliştiriciler İçin)

Projeyi kendi lokal ortamınızda test etmek için aşağıdaki adımları izleyin:

### 1. Backend Kurulumu
```bash
# Repo'yu klonlayın
git clone [https://github.com/KULLANICI_ADIN/CookieExplainer.git](https://github.com/KULLANICI_ADIN/CookieExplainer.git)
cd CookieExplainer/backend

# Gerekli kütüphaneleri yükleyin
pip install -r requirements.txt

# Backend klasörü içine bir .env dosyası oluşturun ve kendi API anahtarlarınızı ekleyin:
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Sunucuyu ayağa kaldırın:
python -m uvicorn app.main:app --reload
# Sunucu [http://127.0.0.1:8000](http://127.0.0.1:8000) adresinde çalışmaya başlayacaktır.
```

### 2. Eklenti (Frontend) Kurulumu
1. Google Chrome'u açın ve adres çubuğuna `chrome://extensions/` yazın.
2. Sağ üst köşeden **"Geliştirici modu"nu (Developer mode)** aktif edin.
3. Sol üstteki **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
4. Klonladığınız proje dizinindeki `extension` klasörünü seçin.
5. CookieExplainer tarayıcınıza eklenecektir!

## 🔮 Gelecek Planları (Faz 3)
* **Web Scraper Entegrasyonu:** Ana sayfada sözleşme bulunmadığı durumlarda (örn. YouTube), eklentinin sayfa altındaki "Gizlilik Politikası" linklerini otomatik bulup o sayfanın içine dalarak okuması.
* **Çoklu Dil Desteği:** LLM promptlarının tarayıcı diline göre dinamik olarak İngilizce/Türkçe yanıt üretmesi.

---
*Geliştirici: Berke Beşli*







