// content.js - 3 Aşamalı Kusursuz Saha Ajanı

const rejectKeywords = ["reject all", "reject", "decline", "tümünü reddet", "reddet", "kabul etmiyorum", "izin verme", "disallow", "deny"];
const necessaryKeywords = ["only necessary", "necessary only", "yalnızca gerekli", "zorunlu çerezler", "sadece zorunlu", "gerekli olanlar", "accept necessary"];
const settingsKeywords = ["ayarlar", "settings", "manage", "customize", "tercihler", "tanımlama", "preferences", "seçenekler", "options", "yönet"];
const saveKeywords = ["kaydet", "save", "onayla", "confirm", "uygula", "apply", "seçimlerimi", "kabul et ve kapat"];

let agentActive = false;
let currentDomain = window.location.hostname.replace('www.', '');

chrome.storage.local.get(["cookieBlockerActive", "whitelist"], (result) => {
    if ((result.cookieBlockerActive || false) && !(result.whitelist || []).includes(currentDomain)) {
        agentActive = true;
        console.log("[CookieExplainer] 3 Aşamalı Ajan Devrede!");
        huntAndDestroy();
        startObserver();
    }
});

// Sadece görünür ve tıklanabilir olan elementleri getiren yardımcı fonksiyon
function getElements() {
    return Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]'))
                .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
}

function huntAndDestroy() {
    if (!agentActive) return;
    const elements = getElements();
    
    // HAMLE 1: Direkt "Reddet" butonunu ara
    let rejectBtn = elements.find(el => {
        let txt = (el.innerText || el.value || el.textContent || "").toLowerCase().trim();
        return rejectKeywords.some(k => txt.includes(k));
    });

    if (rejectBtn) {
        console.log("[CookieExplainer] Hamle 1 Başarılı: Reddet butonu vuruldu!");
        rejectBtn.click();
        chrome.runtime.sendMessage({ action: "INCREMENT_BLOCKED_COUNT" });
        agentActive = false;
        return;
    }

    // HAMLE 2: "Sadece Zorunlu Olanlar" butonunu ara
    let necessaryBtn = elements.find(el => {
        let txt = (el.innerText || el.value || el.textContent || "").toLowerCase().trim();
        return necessaryKeywords.some(k => txt.includes(k));
    });

    if (necessaryBtn) {
        console.log("[CookieExplainer] Hamle 2 Başarılı: Zorunlu çerezler kabul edilip takipçiler reddedildi!");
        necessaryBtn.click();
        chrome.runtime.sendMessage({ action: "INCREMENT_BLOCKED_COUNT" });
        agentActive = false;
        return;
    }

    // HAMLE 3: İkisi de yoksa "Ayarlar"a gir ve "Kaydet"e bas
    let settingsBtn = elements.find(el => {
        let txt = (el.innerText || el.value || el.textContent || "").toLowerCase().trim();
        return settingsKeywords.some(k => txt.includes(k));
    });

    if (settingsBtn) {
        console.log("[CookieExplainer] Hamle 3 Başladı: Ayarlar açılıyor...");
        settingsBtn.click();
        agentActive = false; // Ana taramayı durdur
        
        // Menü animasyonunun bitmesi için 1 saniye bekle
        setTimeout(() => {
            const modalElements = getElements();
            let saveBtn = modalElements.find(el => {
                let txt = (el.innerText || el.value || el.textContent || "").toLowerCase().trim();
                return saveKeywords.some(k => txt.includes(k)) || rejectKeywords.some(k => txt.includes(k));
            });

            if (saveBtn) {
                console.log("[CookieExplainer] Hamle 3 Başarılı: Ayarlar kaydedildi!");
                saveBtn.click();
                chrome.runtime.sendMessage({ action: "INCREMENT_BLOCKED_COUNT" });
            }
        }, 1000);
    }
}

// Siteye sonradan yüklenen pop-up'ları anında yakalamak için gözlemci
function startObserver() {
    const observer = new MutationObserver(() => {
        if (!agentActive) return observer.disconnect();
        huntAndDestroy();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// Analiz için metin çekme 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PAGE_DATA") {
        sendResponse({ text: document.body.innerText });
    }
    return true; 
});