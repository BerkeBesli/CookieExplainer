// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // 1. ANALİZ İŞLEMİ
    if (request.action === "ANALYZE_SITE") {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.id) {
                sendResponse({ success: false, error: "Sekme bulunamadı" });
                return;
            }

            try {
                const cookies = await chrome.cookies.getAll({ url: activeTab.url });
                const cookieNames = cookies.map(c => c.name);
                const domain = new URL(activeTab.url).hostname.replace('www.', '');

                // content.js'den sayfa metnini iste
                chrome.tabs.sendMessage(activeTab.id, { action: "GET_PAGE_DATA" }, async (contentResponse) => {
                    const policyText = (contentResponse && contentResponse.text) ? contentResponse.text : "Metin bulunamadı.";

                    try {
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
                });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        });
        return true; // Asenkron işlem beklemesi için şart!
    }
    
    // 2. SAYAÇ ARTIRMA İŞLEMİ (Saha ajanından gelen tetikleyici)
    else if (request.action === "INCREMENT_BLOCKED_COUNT") {
        chrome.storage.local.get(["blockedCount"], (result) => {
            let count = result.blockedCount || 0;
            chrome.storage.local.set({ blockedCount: count + 1 });
        });
        sendResponse({ success: true });
    }
});