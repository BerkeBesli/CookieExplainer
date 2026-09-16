// popup.js
document.addEventListener("DOMContentLoaded", () => {
    const domainNameEl = document.getElementById("domain-name");
    const scoreContainer = document.getElementById("score-container");
    const magIcon = document.getElementById("mag-icon");
    const scoreText = document.getElementById("privacy-score");
    const summaryBox = document.getElementById("ai-summary");
    const rejectBtn = document.getElementById("reject-btn");

    // Domain adını ekrana yaz
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            const url = new URL(tabs[0].url);
            // Sadece domain'i al (örn: www.imdb.com)
            domainNameEl.textContent = url.hostname.replace('www.', '');
        }
    });

    // Backend'e analiz isteğini gönder
    chrome.runtime.sendMessage({ action: "ANALYZE_SITE" }, (response) => {
        // Arama animasyonunu (sağa sola sallanmayı) durdur
        magIcon.classList.remove("searching");

        if (response && response.success) {
            const data = response.data;
            scoreText.textContent = data.grade;

            // Skora göre metin rengini belirle
            let gradeColor = "#1cb3b4"; // Turkuaz (Varsayılan)
            let bgColor = "#f8fafc";
            
            if (data.grade === "A" || data.grade === "B") {
                gradeColor = "#10b981"; // Zümrüt Yeşili
                bgColor = "#ecfdf5";
            } else if (data.grade === "C") {
                gradeColor = "#f59e0b"; // Kehribar Sarısı
                bgColor = "#fffbeb";
            } else {
                gradeColor = "#ef4444"; // Kırmızı
                bgColor = "#fef2f2";
            }

            scoreText.style.color = gradeColor;
            scoreContainer.style.background = bgColor;
            summaryBox.textContent = data.summary;
            
            // "Paranoid Mode" butonunu aktif et
            rejectBtn.disabled = false;

        } else {
            // Hata Durumu
            scoreText.textContent = "?";
            scoreText.style.color = "#64748b";
            summaryBox.textContent = "Bağlantı hatası: Sunucuya ulaşılamıyor.";
        }

        // Büyüteci zoom yapıp kaybeden ve Harfi ortaya çıkartan sınıfı ekle
        scoreContainer.classList.add("reveal-mode");
    });

    // Çerezleri Engelle Butonu
    rejectBtn.addEventListener("click", () => {
        rejectBtn.textContent = "İşleniyor...";
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "AUTO_REJECT" }, (response) => {
                if (response && response.success) {
                    rejectBtn.textContent = "Çerezler Reddedildi!";
                    rejectBtn.style.background = "#10b981"; // Başarılı Yeşili
                } else {
                    rejectBtn.textContent = "Buton Bulunamadı";
                    rejectBtn.style.background = "#ef4444"; // Hata Kırmızısı
                }
                
                // 3 saniye sonra butonu eski haline getir
                setTimeout(() => {
                    rejectBtn.textContent = "Çerezleri Engelle";
                    rejectBtn.style.background = "#1cb3b4";
                }, 3000);
            });
        });
    });
});