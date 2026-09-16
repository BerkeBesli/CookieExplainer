// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ANALYZE_SITE") {
        
        // 1. Aktif olan sekmeyi bul
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.url) {
                sendResponse({ success: false, error: "Aktif sekme bulunamadı." });
                return;
            }

            const url = new URL(activeTab.url);
            const domain = url.hostname;

            try {
                // 2. İlgili domain'e ait tüm çerezleri Chrome API ile topla
                const cookies = await chrome.cookies.getAll({ domain: domain });
                const cookieNames = cookies.map(c => c.name);

                // 3. content.js'den sayfa metnini iste
                chrome.tabs.sendMessage(activeTab.id, { action: "GET_PAGE_DATA" }, async (contentResponse) => {
                    const policyText = (contentResponse && contentResponse.text) ? contentResponse.text : "Metin bulunamadı.";

                    // 4. FastAPI Backend'e POST isteği at
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
                });
            } catch (error) {
                console.error("Analiz Hatası:", error);
                sendResponse({ success: false, error: error.message });
            }
        });
        
        return true; // Asenkron fetch işlemi için gerekli
    }
});