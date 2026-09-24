// popup.js
document.addEventListener("DOMContentLoaded", () => {
    const domainBadge = document.getElementById("domain-badge");
    const domainNameEl = document.getElementById("domain-name");
    const scoreContainer = document.getElementById("score-container");
    const centerIcon = document.getElementById("center-icon");
    const scoreText = document.getElementById("privacy-score");
    const summaryBox = document.getElementById("ai-summary");
    const scoreTooltip = document.getElementById("score-tooltip");
    const blockerToggle = document.getElementById("blocker-toggle");
    const blockedCountEl = document.getElementById("blocked-count");
    const resetBtn = document.getElementById("reset-counter-btn");

    let currentDomain = "";

    // İkon SVG Yolları
    const magSVG = `<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>`;
    const shieldSVG = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`;

    // 1. Ayarları Yükle ve Domain'i Bul
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            const url = new URL(tabs[0].url);
            currentDomain = url.hostname.replace('www.', '');
            domainNameEl.textContent = currentDomain;

            // Hafızadan verileri çek
            chrome.storage.local.get(["cookieBlockerActive", "blockedCount", "whitelist"], (result) => {
                const isActive = result.cookieBlockerActive || false;
                const whitelist = result.whitelist || [];
                
                blockerToggle.checked = isActive;
                blockedCountEl.textContent = result.blockedCount || 0;
                
                // İkon Değişimi: Blocker açıksa Kalkan, kapalıysa Büyüteç
                centerIcon.innerHTML = isActive ? shieldSVG : magSVG;

                // Whitelist Kontrolü
                if (whitelist.includes(currentDomain)) {
                    domainBadge.classList.add("whitelisted");
                    domainBadge.title = "Korumayı Aç (Şu an Whitelist'te)";
                }
            });
        }
    });

    // 2. Kalkan Anahtarı (Toggle) Değişimi
    blockerToggle.addEventListener("change", (e) => {
        const isActive = e.target.checked;
        chrome.storage.local.set({ cookieBlockerActive: isActive });
        centerIcon.innerHTML = isActive ? shieldSVG : magSVG;
        
        if(isActive) {
            chrome.action.setBadgeText({ text: "ON" });
            chrome.action.setBadgeBackgroundColor({ color: "#1cb3b4" });
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    });

    // 3. Whitelist (Güvenilir Liste) Tıklaması
    domainBadge.addEventListener("click", () => {
        chrome.storage.local.get(["whitelist"], (result) => {
            let whitelist = result.whitelist || [];
            
            if (whitelist.includes(currentDomain)) {
                // Listeden çıkar
                whitelist = whitelist.filter(d => d !== currentDomain);
                domainBadge.classList.remove("whitelisted");
                domainBadge.title = "Bu sitede korumayı kapat";
            } else {
                // Listeye ekle
                whitelist.push(currentDomain);
                domainBadge.classList.add("whitelisted");
                domainBadge.title = "Korumayı Aç (Şu an Whitelist'te)";
            }
            chrome.storage.local.set({ whitelist: whitelist });
        });
    });

    // 4. Sayaç Sıfırlama ve Pulse Efekti
    resetBtn.addEventListener("click", () => {
        chrome.storage.local.set({ blockedCount: 0 }, () => {
            blockedCountEl.textContent = "0";
            blockedCountEl.classList.remove("pulse-effect"); // Animasyonu sıfırla
            void blockedCountEl.offsetWidth; // Reflow tetikle
            blockedCountEl.classList.add("pulse-effect"); // Animasyonu oynat
        });
    });

    // 5. Analizi Başlat ve Tooltip'i Doldur
    chrome.runtime.sendMessage({ action: "ANALYZE_SITE" }, (response) => {
        centerIcon.classList.remove("searching");
        
        if (response && response.success) {
            const data = response.data;
            scoreText.textContent = data.grade;

            // Tooltip içeriğini oluştur (Örn: "Tehlike: Sitede 5 adet takip çerezi var!")
            let cookiesCount = Object.keys(data.technical_cookies).length;
            scoreTooltip.textContent = `Sitede ${cookiesCount} adet takipçi çerez tespit edildi.`;

            let gradeColor = "#1cb3b4"; let bgColor = "#f8fafc";
            if (data.grade === "A" || data.grade === "B") {
                gradeColor = "#10b981"; bgColor = "#ecfdf5";
            } else if (data.grade === "C") {
                gradeColor = "#f59e0b"; bgColor = "#fffbeb";
            } else {
                gradeColor = "#ef4444"; bgColor = "#fef2f2";
            }

            scoreText.style.color = gradeColor;
            scoreContainer.style.background = bgColor;
            summaryBox.textContent = data.summary;
        } else {
            scoreText.textContent = "?";
            scoreText.style.color = "#64748b";
            summaryBox.textContent = "Analiz yapılamadı.";
            scoreTooltip.textContent = "Hata oluştu.";
        }
        scoreContainer.classList.add("reveal-mode");
    });
});