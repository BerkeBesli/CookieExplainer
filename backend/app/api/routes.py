# app/api/routes.py
from fastapi import APIRouter
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.db_service import db
from app.services.llm_service import analyze_privacy_policy
from app.services.rule_engine import classify_cookies, calculate_privacy_score
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_site(request: AnalyzeRequest):
    domain = request.domain
    
    # 1. Önbellek (Cache) Kontrolü
    try:
        response = db.table("sites_analysis").select("*").eq("domain", domain).execute()
        if response.data:
            record = response.data[0]
            last_analyzed = datetime.fromisoformat(record["last_analyzed_at"].replace("Z", "+00:00"))
            
            # SADECE 30 günden yeniyse VE eski bir hata kaydı değilse cache'i kullan!
            is_recent = datetime.now(timezone.utc) - last_analyzed < timedelta(days=30)
            is_valid = "otomatik analiz edilemedi" not in record["summary"]
            
            if is_recent and is_valid:
                return AnalyzeResponse(
                    domain=record["domain"],
                    privacy_score=record["privacy_score"],
                    grade=record["grade"],
                    summary=record["summary"],
                    technical_cookies=record["technical_cookies"],
                    discrepancies=record["discrepancies"],
                    source="cache"
                )
    except Exception as e:
        logger.warning(f"Cache kontrolünde hata, canlı analize geçiliyor: {e}")

    # 2. Canlı Analiz Süreci (Groq Llama 3)
    llm_result = analyze_privacy_policy(request.policy_text)
    classified_cookies = classify_cookies(request.cookies)
    score, grade, discrepancies = calculate_privacy_score(llm_result, classified_cookies)
    summary = llm_result.get("summary", "Gizlilik politikası çok karmaşık olduğu için tam özet çıkarılamadı.")

    # 3. Sonucu Veritabanına Kaydet veya Güncelle (Upsert)
    # Eğer eski hatalı kayıt varsa, bu işlem onun üzerine yepyeni ve doğru analizi yazacaktır.
    try:
        db.table("sites_analysis").upsert({
            "domain": domain,
            "privacy_score": score,
            "grade": grade,
            "summary": summary,
            "technical_cookies": classified_cookies,
            "discrepancies": discrepancies,
            "last_analyzed_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Veritabanına kayıt sırasında hata: {e}")

    # 4. Yeni Analiz Yanıtını Döndür
    return AnalyzeResponse(
        domain=domain,
        privacy_score=score,
        grade=grade,
        summary=summary,
        technical_cookies=classified_cookies,
        discrepancies=discrepancies,
        source="live_analysis"
    )