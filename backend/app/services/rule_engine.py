TRACKING_COOKIES = ["_fbp", "_ga", "_gid", "IDE", "fr", "tr", "test_cookie"]
ESSENTIAL_COOKIES = ["session_id", "csrf_token", "cookie_consent", "auth_token"]

def classify_cookies(cookie_names: list) -> dict:
    classified = {
        "essential": [],
        "analytics_tracking": [],
        "unknown": []
    }
    
    for cookie in cookie_names:
        cookie_lower = cookie.lower()
        if any(track in cookie_lower for track in TRACKING_COOKIES):
            classified["analytics_tracking"].append(cookie)
        elif any(ess in cookie_lower for ess in ESSENTIAL_COOKIES):
            classified["essential"].append(cookie)
        else:
            classified["unknown"].append(cookie)
            
    return classified

def calculate_privacy_score(llm_analysis: dict, classified_cookies: dict) -> tuple:
    score = 100
    discrepancies = []
    
    # 1. LLM Risk Seviyesi
    risk = llm_analysis.get("risk_level", "High")
    if risk == "High":
        score -= 25
    elif risk == "Medium":
        score -= 10
        
    # 2. Veri Paylaşım Cezası
    data_sharing = llm_analysis.get("data_sharing")
    if data_sharing is True:
        score -= 15
        
    # 3. Veri Saklama Süresi Cezası
    retention = str(llm_analysis.get("retention_period", "")).lower()
    if "belirsiz" in retention or "süresiz" in retention or "unknown" in retention:
        score -= 10
        
    # 4. Kademeli ve Limitli Çerez Cezası
    tracking_count = len(classified_cookies["analytics_tracking"])
    if tracking_count > 0:
        if tracking_count <= 3:
            score -= 5
        elif tracking_count <= 7:
            score -= 15
        else:
            score -= 30  # Ceza tavanı (Maksimum 30 puan düşer)
            
    # 5. Çapraz Doğrulama (Çelişki Tespiti)
    if data_sharing is False and tracking_count > 0:
        score -= 20
        discrepancies.append("Politika veri paylaşılmadığını belirtiyor ancak arka planda reklam/takip çerezleri tespit edildi.")

    # 6. Kullanıcı Hakları Ödülü
    user_rights = llm_analysis.get("user_rights", [])
    if isinstance(user_rights, list) and len(user_rights) > 0:
        score += 10
        
    # Skoru 0-100 arasında sınırla
    score = max(0, min(100, score))
    
    # Yeni ve Daha Adil Harf Notu Kırılımı
    if score >= 85:
        grade = "A" # 85-100 arası (Ufak 1-2 çerezi olan dürüst siteler A alabilir)
    elif score >= 70:
        grade = "B" # 70-84 arası
    elif score >= 50:
        grade = "C" # 50-69 arası (İnternetin büyük çoğunluğu buraya düşecek)
    elif score >= 35:
        grade = "D" # 35-49 arası
    else:
        grade = "F" # 0-34 arası
        
    return float(score), grade, discrepancies