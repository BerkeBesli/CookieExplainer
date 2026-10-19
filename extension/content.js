// content.js - 4 Aşamalı Saha Ajanı & Sayfa İçi Yüzen Panel (Shadow DOM)

const rejectKeywords = ["reject all", "reject", "decline", "tümünü reddet", "reddet", "kabul etmiyorum", "izin verme", "disallow", "deny"];
const necessaryKeywords = ["only necessary", "necessary only", "yalnızca gerekli", "zorunlu çerezler", "sadece zorunlu", "gerekli olanlar", "accept necessary"];
const settingsKeywords = ["ayarlar", "settings", "manage", "customize", "tercihler", "tanımlama bilgisi", "preferences", "seçenekler", "options", "yönet"];
const saveKeywords = ["kaydet", "save", "onayla", "confirm", "uygula", "apply", "seçimlerimi", "kabul et ve kapat"];
const acceptAllKeywords = ["tümünü kabul et", "accept all", "kabul et", "agree", "allow all", "tümüne izin ver", "anladım", "got it"];

let agentActive = false;
const currentDomain = window.location.hostname.replace(/^www\./, '');

// ==========================================
// BÖLÜM 1: 4 AŞAMALI OTONOM SAHA AJANI
// ==========================================
chrome.storage.local.get(["cookieBlockerActive", "whitelist"], (result) => {
    const isActive = result.cookieBlockerActive || false;
    const whitelist = result.whitelist || [];
    const isWhitelisted = whitelist.some(w => window.location.hostname.includes(w));

    if (isActive && !isWhitelisted) {
        agentActive = true;
        setTimeout(huntAndDestroy, 300);
        startObserver();
    }
});

function getElements() {
    return Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]'))
        .filter(el => {
            if (el.id === "cookie-explainer-host") return false;
            const style = window.getComputedStyle(el);
            return el.offsetWidth > 0 && el.offsetHeight > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        });
}

function huntAndDestroy() {
    if (!agentActive) return;
    const elements = getElements();
    const findBtn = (keywords) => elements.find(el => {
        let txt = (el.innerText || el.value || el.textContent || "").toLowerCase().trim();
        return keywords.some(k => txt.includes(k));
    });

    // HAMLE 1: Reddet
    let rejectBtn = findBtn(rejectKeywords);
    if (rejectBtn) { rejectBtn.click(); strike(); return; }

    // HAMLE 2: Sadece Zorunlu
    let necessaryBtn = findBtn(necessaryKeywords);
    if (necessaryBtn) { necessaryBtn.click(); strike(); return; }

    // HAMLE 3: Ayarlar -> Kaydet
    let settingsBtn = findBtn(settingsKeywords);
    if (settingsBtn) {
        settingsBtn.click();
        agentActive = false;
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

    // HAMLE 4: Son Çare Kabul Et
    let acceptAllBtn = findBtn(acceptAllKeywords);
    if (acceptAllBtn) { acceptAllBtn.click(); strike(); return; }
}

function strike(deactivate = true) {
    chrome.runtime.sendMessage({ action: "INCREMENT_BLOCKED_COUNT" });
    if (deactivate) agentActive = false;
}

function startObserver() {
    const observer = new MutationObserver(() => {
        if (!agentActive) return observer.disconnect();
        huntAndDestroy();
    });
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// ==========================================
// BÖLÜM 2: SAYFA İÇİ YÜZEN PANEL (FLOATING UI)
// ==========================================
let panelHost = null;
let shadowRoot = null;
let isPanelOpen = false;


const magSVG = `<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>`;
const shieldSVG = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`;

function createFloatingPanel() {
    panelHost = document.createElement("div");
    panelHost.id = "cookie-explainer-host";
    panelHost.style.cssText = "position: fixed; top: 16px; right: 16px; z-index: 2147483647; background: transparent; border: none; margin: 0; padding: 0;";
    shadowRoot = panelHost.attachShadow({ mode: "open" });

    shadowRoot.innerHTML = `
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            
            .floating-card {
                width: 330px;
                background: #ffffff;
                border: 5px solid #1cb3b4;
                border-radius: 20px;
                padding: 18px 20px;
                color: #1e293b;
                box-shadow: 0 20px 40px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(28, 179, 180, 0.15);
                animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                position: relative;
                overflow: visible;
            }

            @keyframes slideIn {
                0% { opacity: 0; transform: translateY(-12px) scale(0.96); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }

            /* Üst Başlık ve Kurabiye Harfler */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 14px;
                border-bottom: 2px solid #f1f5f9;
                margin-bottom: 18px;
                gap: 8px;
            }

            .brand-title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 15.5px;
                font-weight: 800;
                letter-spacing: -0.5px;
                white-space: nowrap;
                flex-shrink: 0;
                cursor: default;
            }

            .brand-logo-icon {
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #1cb3b4, #0d9488);
                border-radius: 7px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                box-shadow: 0 3px 8px rgba(28, 179, 180, 0.3);
                transition: transform 0.3s ease;
            }
            .brand-title:hover .brand-logo-icon {
                transform: rotate(-10deg) scale(1.08);
            }

            .brand-text-dark {
                color: #0f172a;
            }

            .brand-text-accent {
                background: linear-gradient(135deg, #1cb3b4, #0f766e);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: 6px;
                min-width: 0;
            }

            /* Uzun URL Kısaltma (...) */
            .domain-badge {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 11px;
                background: #e0f2f1;
                color: #0d9488;
                padding: 5px 9px;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.25s ease;
                max-width: 110px;
            }
            .domain-badge:hover { background: #ccfbf1; transform: translateY(-1px); }
            .domain-badge.whitelisted { background: #fef2f2; color: #ef4444; }
            .whitelist-icon { width: 12px; height: 12px; flex-shrink: 0; }
            #domain-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: block;
            }

            .close-btn {
                background: #f1f5f9;
                border: none;
                color: #64748b;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 13px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: 0.2s;
            }
            .close-btn:hover { background: #fee2e2; color: #ef4444; }

            /* Skor Dairesi & Canlı Gölgeler */
            .score-wrapper {
                position: relative;
                width: 96px;
                height: 96px;
                margin: 0 auto 18px;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(145deg, #f8fafc, #f1f5f9);
                border-radius: 50%;
                box-shadow: 0 6px 16px rgba(28, 179, 180, 0.12), inset 0 2px 4px rgba(255,255,255,0.8);
                transition: all 0.5s ease;
                cursor: help;
            }
            .score-wrapper:hover { transform: scale(1.04); }

            .dynamic-icon { width: 40px; height: 40px; stroke: #1cb3b4; z-index: 2; transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .searching { animation: searchAnim 1.4s infinite ease-in-out alternate; }
            @keyframes searchAnim { 0% { transform: translate(-6px, -6px) rotate(-10deg); } 100% { transform: translate(6px, 6px) rotate(10deg); } }

            .revealed-score { position: absolute; font-size: 46px; font-weight: 800; color: #1cb3b4; opacity: 0; transform: scale(0.5); transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 3; }
            .reveal-mode .dynamic-icon { transform: scale(3.5); opacity: 0; }
            .reveal-mode .revealed-score { opacity: 1; transform: scale(1); }

            /* Tooltip */
            .tooltip-text {
                visibility: hidden;
                width: 210px;
                background-color: #1e293b;
                color: #fff;
                text-align: center;
                border-radius: 8px;
                padding: 8px 10px;
                position: absolute;
                z-index: 20;
                bottom: 112%;
                left: 50%;
                transform: translateX(-50%);
                opacity: 0;
                transition: opacity 0.25s;
                font-size: 11px;
                font-weight: 500;
                box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                pointer-events: none;
            }
            .tooltip-text::after {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: #1e293b transparent transparent transparent;
            }
            .score-wrapper:hover .tooltip-text { visibility: visible; opacity: 1; }

            /* Özet Kutusu */
            .summary-box {
                background: #f8fafc;
                border: 1px solid #f1f5f9;
                padding: 14px;
                border-radius: 14px;
                font-size: 12.5px;
                line-height: 1.5;
                color: #475569;
                text-align: center;
                margin-bottom: 16px;
                min-height: 58px;
                max-height: 150px;
                overflow-y: auto;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Cookie Blocker Switch Kutusu */
            .kalkan-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(to right, #f8fafc, #f0fdfa);
                padding: 12px 16px;
                border-radius: 14px;
                border: 1px solid #ccfbf1;
                margin-bottom: 14px;
            }
            .kalkan-text { font-weight: 700; font-size: 13.5px; color: #0f172a; }

            .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .35s; border-radius: 24px; }
            .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .35s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
            input:checked + .slider { background-color: #1cb3b4; }
            input:checked + .slider:before { transform: translateX(20px); }

            /* Sayaç & Sıfırlama */
            .counter-wrapper {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 6px;
                font-size: 12.5px;
                color: #64748b;
            }
            #blocked-count { font-weight: 800; color: #1cb3b4; font-size: 15px; transition: 0.3s; }
            .pulse-effect { animation: pulseGreen 0.8s; }
            @keyframes pulseGreen { 0% { color: #1cb3b4; transform: scale(1); } 50% { color: #10b981; transform: scale(1.4); } 100% { color: #1cb3b4; transform: scale(1); } }

            .reset-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: 0.25s; }
            .reset-btn:hover { color: #ef4444; background: #fee2e2; }
            .reset-btn svg { width: 15px; height: 15px; transition: 0.3s; }
            .reset-btn:active svg { transform: rotate(180deg); }
        </style>

        <div class="floating-card">
            <div class="header">
                <div class="brand-title">
                    <div class="brand-logo-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                            <path d="M8.5 8.5v.01"></path>
                            <path d="M16 15.5v.01"></path>
                            <path d="M12 12v.01"></path>
                        </svg>
                    </div>
                    <div>
                        <span class="brand-text-dark">Cookie</span><span class="brand-text-accent">Explainer</span>
                    </div>
                </div>
                <div class="header-right">
                    <div id="domain-badge" class="domain-badge" title="${currentDomain} - Korumayı aç/kapat">
                        <svg class="whitelist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span id="domain-name">${currentDomain}</span>
                    </div>
                    <button id="close-panel-btn" class="close-btn" title="Paneli Kapat">✕</button>
                </div>
            </div>

            <div id="score-container" class="score-wrapper">
                <span class="tooltip-text" id="score-tooltip">Analiz ediliyor...</span>
                <svg class="dynamic-icon searching" id="center-icon" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    ${magSVG}
                </svg>
                <div id="privacy-score" class="revealed-score"></div>
            </div>

            <div class="summary-box" id="ai-summary">
                Sitenin politikaları ve çerezleri taranıyor...
            </div>

            <div class="kalkan-container">
                <span class="kalkan-text">Cookie Blocker</span>
                <label class="switch">
                    <input type="checkbox" id="blocker-toggle">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="counter-wrapper">
                Bugüne kadar <span id="blocked-count">0</span> çerez reddedildi
                <button id="reset-counter-btn" class="reset-btn" title="Sayacı Sıfırla">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(panelHost);
    bindPanelEvents();
    runSiteAnalysis();
}

function bindPanelEvents() {
    const domainBadge = shadowRoot.getElementById("domain-badge");
    const centerIcon = shadowRoot.getElementById("center-icon");
    const blockerToggle = shadowRoot.getElementById("blocker-toggle");
    const blockedCountEl = shadowRoot.getElementById("blocked-count");
    const resetBtn = shadowRoot.getElementById("reset-counter-btn");
    const closeBtn = shadowRoot.getElementById("close-panel-btn");

    // Verileri yükle
    chrome.storage.local.get(["cookieBlockerActive", "blockedCount", "whitelist"], (result) => {
        const isActive = result.cookieBlockerActive || false;
        const whitelist = result.whitelist || [];
        
        blockerToggle.checked = isActive;
        blockedCountEl.textContent = result.blockedCount || 0;
        centerIcon.innerHTML = isActive ? shieldSVG : magSVG;

        if (whitelist.includes(currentDomain)) {
            domainBadge.classList.add("whitelisted");
        }
    });

    // Kapatma Butonu
    closeBtn.addEventListener("click", () => {
        panelHost.style.display = "none";
        isPanelOpen = false;
    });

    // Cookie Blocker Aç/Kapa
    blockerToggle.addEventListener("change", (e) => {
        const isActive = e.target.checked;
        chrome.storage.local.set({ cookieBlockerActive: isActive });
        centerIcon.innerHTML = isActive ? shieldSVG : magSVG;
        chrome.runtime.sendMessage({ action: "UPDATE_BADGE", active: isActive });

        if (isActive) {
            agentActive = true;
            huntAndDestroy();
        }
    });

    // Whitelist Ekle/Çıkar
    domainBadge.addEventListener("click", () => {
        chrome.storage.local.get(["whitelist"], (result) => {
            let whitelist = result.whitelist || [];
            if (whitelist.includes(currentDomain)) {
                whitelist = whitelist.filter(d => d !== currentDomain);
                domainBadge.classList.remove("whitelisted");
            } else {
                whitelist.push(currentDomain);
                domainBadge.classList.add("whitelisted");
            }
            chrome.storage.local.set({ whitelist: whitelist });
        });
    });

    // Sayacı Sıfırla
    resetBtn.addEventListener("click", () => {
        chrome.storage.local.set({ blockedCount: 0 }, () => {
            blockedCountEl.textContent = "0";
            blockedCountEl.classList.remove("pulse-effect");
            void blockedCountEl.offsetWidth;
            blockedCountEl.classList.add("pulse-effect");
        });
    });
}

function runSiteAnalysis() {
    const scoreContainer = shadowRoot.getElementById("score-container");
    const centerIcon = shadowRoot.getElementById("center-icon");
    const scoreText = shadowRoot.getElementById("privacy-score");
    const summaryBox = shadowRoot.getElementById("ai-summary");
    const scoreTooltip = shadowRoot.getElementById("score-tooltip");

    scoreContainer.classList.remove("reveal-mode");
    centerIcon.classList.add("searching");
    summaryBox.textContent = "Sitenin politikaları ve çerezleri taranıyor...";

    chrome.runtime.sendMessage({
        action: "ANALYZE_SITE",
        domain: currentDomain,
        url: window.location.href,
        text: document.body ? document.body.innerText : ""
    }, (response) => {
        centerIcon.classList.remove("searching");

        if (response && response.success) {
            const data = response.data;
            scoreText.textContent = data.grade;

            let cookiesCount = data.technical_cookies ? Object.keys(data.technical_cookies).length : 0;
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
            summaryBox.textContent = "Analiz yapılamadı. Uvicorn sunucusunun açık olduğundan emin olun.";
            scoreTooltip.textContent = "Sunucu bağlantı hatası.";
        }
        scoreContainer.classList.add("reveal-mode");
    });
}

// İkona tıklandığında Paneli Göster / Gizle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TOGGLE_PANEL") {
        if (!panelHost) {
            createFloatingPanel();
            isPanelOpen = true;
        } else {
            isPanelOpen = !isPanelOpen;
            panelHost.style.display = isPanelOpen ? "block" : "none";
            if (isPanelOpen) {
                // Panel her açıldığında güncel sayacı çek
                const blockedCountEl = shadowRoot.getElementById("blocked-count");
                chrome.storage.local.get(["blockedCount"], (res) => {
                    if (blockedCountEl) blockedCountEl.textContent = res.blockedCount || 0;
                });
            }
        }
        sendResponse({ status: "ok" });
    } else if (request.action === "GET_PAGE_DATA") {
        sendResponse({ text: document.body ? document.body.innerText : "" });
    }
    return true;
});