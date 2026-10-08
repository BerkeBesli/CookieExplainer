// content.js - 4 Aşamalı Final Ajan

const rejectKeywords = ["reject all", "reject", "decline", "tümünü reddet", "reddet", "kabul etmiyorum", "izin verme", "disallow", "deny"];
const necessaryKeywords = ["only necessary", "necessary only", "yalnızca gerekli", "zorunlu çerezler", "sadece zorunlu", "gerekli olanlar", "accept necessary"];
const settingsKeywords = ["ayarlar", "settings", "manage", "customize", "tercihler", "tanımlama bilgisi", "preferences", "seçenekler", "options", "yönet"];
const saveKeywords = ["kaydet", "save", "onayla", "confirm", "uygula", "apply", "seçimlerimi", "kabul et ve kapat"];
const acceptAllKeywords = ["tümünü kabul et", "accept all", "kabul et", "agree", "allow all", "tümüne izin ver", "anladım", "got it"]; // HAMLE 4 EKLENDİ

let agentActive = false;

chrome.storage.local.get(["cookieBlockerActive", "whitelist"], (result) => {
    const isActive = result.cookieBlockerActive || false;
    const whitelist = result.whitelist || [];
    const currentHost = window.location.hostname;
    

    const isWhitelisted = whitelist.some(w => currentHost.includes(w));

    if (isActive && !isWhitelisted) {
        agentActive = true;
        console.log("[CookieExplainer] 4 Aşamalı Ajan Devrede!");
        // Sayfanın DOM ağacının oturması için ufak bir avans veriyoruz
        setTimeout(huntAndDestroy, 300); 
        startObserver();
    }
});

function getElements() {
    return Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]'))
                .filter(el => {
                    // Görünmez (display: none) olan butonları kesin olarak eliyoruz
                    const style = window.getComputedStyle(el);
                    return el.offsetWidth > 0 && el.offsetHeight > 0 && style.display !== 'none' && style.visibility !== 'hidden';
                });
}

function huntAndDestroy() {
    if (!agentActive) return;
    const elements = getElements();
    
    // Kelime arama yardımcı fonksiyonu
    const findBtn = (keywords) => elements.find(el => {
        let txt = (el.innerText || el.value || el.textContent || "").toLowerCase().trim();
        return keywords.some(k => txt.includes(k));
    });

    // HAMLE 1: Reddet
    let rejectBtn = findBtn(rejectKeywords);
    if (rejectBtn) {
        rejectBtn.click();
        strike(); return;
    }

    // HAMLE 2: Sadece Zorunlu
    let necessaryBtn = findBtn(necessaryKeywords);
    if (necessaryBtn) {
        necessaryBtn.click();
        strike(); return;
    }

    // HAMLE 3: Ayarlar -> Kaydet
    let settingsBtn = findBtn(settingsKeywords);
    if (settingsBtn) {
        settingsBtn.click();
        agentActive = false; // Alt döngüye geç
        setTimeout(() => {
            const modalElements = getElements();
            let saveBtn = modalElements.find(el => {
                let txt = (el.innerText || el.value || el.textContent || "").toLowerCase().trim();
                return saveKeywords.some(k => txt.includes(k)) || rejectKeywords.some(k => txt.includes(k));
            });
            if (saveBtn) { saveBtn.click(); strike(false); }
        }, 1000);
        return;
    }

    // HAMLE 4 (SON ÇARE): Tümünü Kabul Et (HyperX ve benzerleri için)
    let acceptAllBtn = findBtn(acceptAllKeywords);
    if (acceptAllBtn) {
        console.log("[CookieExplainer] Hamle 4 Başarılı: Son çare olarak Kabul Et vuruldu!");
        acceptAllBtn.click();
        strike(); return;
    }
}

// Başarılı vuruş sonrası sayacı artırıp ajanı uyutan fonksiyon
function strike(deactivate = true) {
    chrome.runtime.sendMessage({ action: "INCREMENT_BLOCKED_COUNT" });
    if(deactivate) agentActive = false;
}

function startObserver() {
    const observer = new MutationObserver(() => {
        if (!agentActive) return observer.disconnect();
        huntAndDestroy();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PAGE_DATA") {
        sendResponse({ text: document.body.innerText });
    }
    return true; 
});