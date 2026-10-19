// background.js - Floating Panel & API İşçisi

// 1. Eklenti İkonuna Tıklandığında Sayfa İçi Yüzen Paneli Aç/Kapat
chrome.action.onClicked.addListener((tab) => {
    if (tab && tab.id && !tab.url.startsWith("chrome://")) {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_PANEL" }).catch(() => {
            console.warn("Bu sayfada panel açılamıyor veya sayfa yenilenmeli.");
        });
    }
});

// 2. Mesaj Dinleyicisi (Analiz, Sayaç ve Rozet)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // SİTE ANALİZİ
    if (request.action === "ANALYZE_SITE") {
        (async () => {
            try {
                const targetUrl = request.url || (sender.tab && sender.tab.url);
                if (!targetUrl) throw new Error("URL alınamadı");

                const cookies = await chrome.cookies.getAll({ url: targetUrl });
                const cookieNames = cookies.map(c => c.name);
                const domain = request.domain || new URL(targetUrl).hostname.replace('www.', '');
                const policyText = request.text || "Metin bulunamadı.";

                const apiResponse = await fetch("http://127.0.0.1:8000/api/v1/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        domain: domain,
                        cookies: cookieNames,
                        policy_text: policyText
                    })
                });

                if (!apiResponse.ok) throw new Error("Sunucu hatası");

                const data = await apiResponse.json();
                sendResponse({ success: true, data: data });
            } catch (error) {
                console.error("Analiz Hatası:", error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true; // Asenkron yanıt için şart
    }
    
    // SAYAÇ ARTIRMA
    else if (request.action === "INCREMENT_BLOCKED_COUNT") {
        chrome.storage.local.get(["blockedCount"], (result) => {
            let count = result.blockedCount || 0;
            chrome.storage.local.set({ blockedCount: count + 1 });
        });
        sendResponse({ success: true });
    }

    // ROZET (ON/OFF) GÜNCELLEME
    else if (request.action === "UPDATE_BADGE") {
        if (request.active) {
            chrome.action.setBadgeText({ text: "ON" });
            chrome.action.setBadgeBackgroundColor({ color: "#1cb3b4" });
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
        sendResponse({ success: true });
    }
});