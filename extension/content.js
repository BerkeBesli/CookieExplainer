// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PAGE_DATA") {
        // MVP aşamasında, LLM'in token sınırını aşmamak için sayfanın ilk 5000 karakterini alıyoruz.
        const pageText = document.body.innerText.substring(0, 5000);
        sendResponse({ text: pageText });
    } 
    else if (request.action === "AUTO_REJECT") {
        // Paranoid Mode: DOM üzerinde bilinen reddetme kelimelerini arayan basit kural motoru
        const keywords = ["reddet", "reject", "decline", "tümünü reddet", "kabul etmiyorum"];
        let clicked = false;
        
        // Sayfadaki tüm butonları ve linkleri tara
        const buttons = document.querySelectorAll("button, a, div[role='button']");
        buttons.forEach(btn => {
            const btnText = btn.innerText.toLowerCase();
            if (keywords.some(keyword => btnText.includes(keyword))) {
                btn.click();
                clicked = true;
            }
        });
        
        sendResponse({ success: clicked });
    }
    return true; // Asenkron yanıt döneceğimizi Chrome'a bildiriyoruz
});