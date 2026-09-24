# CookieExplainer 🍪🔍

CookieExplainer, kullanıcıların ziyaret ettikleri web sitelerinin çerez politikalarını ve gizlilik sözleşmelerini yapay zeka kullanarak saniyeler içinde analiz eden ve sitelere A'dan F'ye kadar güvenlik skoru veren bir Chrome eklentisidir.

## 🚀 Teknolojiler
*   **Frontend:** Chrome Extension (Manifest V3), HTML, CSS, JavaScript
*   **Backend:** Python, FastAPI
*   **Yapay Zeka:** Groq API (Llama 3 OSS 20B)
*   **Veritabanı:** Supabase (PostgreSQL)

## ⚙️ Özellikler
*   **Anlık Analiz:** Sitenin çerezlerini ve (varsa) gizlilik politikasını tarar.
*   **Akıllı Skorlama:** Özel kural motoru ve LLM değerlendirmesiyle A (Güvenli) ile F (Tehlikeli) arası skor üretir.
*   **Paranoid Mode:** Tek tıkla sayfadaki çerez reddetme butonlarını bulup otomatik tıklar.
*   **Akıllı Önbellek (Caching):** Analiz edilen siteleri Supabase üzerinde 30 gün boyunca tutarak API maliyetlerini düşürür ve hızı artırır.

## 🛠️ Kurulum 
Proje `backend` ve `extension` olmak üzere iki ana modülden oluşmaktadır. Geliştirme ortamında ayağa kaldırmak için... 
