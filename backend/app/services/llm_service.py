# app/services/llm_service.py
import json
import logging
import re
from groq import Groq
from app.core.config import settings
from app.core.prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Groq İstemcisini Başlatıyoruz
client = Groq(api_key=settings.GROQ_API_KEY)

def analyze_privacy_policy(policy_text: str) -> dict:
    try:
        safe_text = policy_text[:15000]

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Aşağıdaki metni analiz et:\n\n{safe_text}"
                }
            ],
            model="openai/gpt-oss-20b", # <-- BURAYI DEĞİŞTİRDİK (Eski ve %100 açık olan temel Llama 3 sürümü)
            response_format={"type": "json_object"}, 
            temperature=0.0, 
        )
        
        # Gelen yanıtı alıyoruz
        result_text = chat_completion.choices[0].message.content.strip()
        
        # JSON yapısını bozabilecek olası Markdown etiketlerini (```json ... ```) temizliyoruz
        if result_text.startswith("```"):
            result_text = re.sub(r"^```json", "", result_text, flags=re.IGNORECASE)
            result_text = re.sub(r"```$", "", result_text).strip()
            
        result = json.loads(result_text)
        return result
        
    except Exception as e:
        logger.error(f"LLM Analiz Hatası: {e}")
        # Hata Durumu (Fallback)
        return {
            "data_sharing": True,
            "retention_period": "Bilinmiyor",
            "user_rights": [],
            "risk_level": "High",
            "summary": "Gizlilik politikası çok karmaşık olduğu veya API hatası yaşandığı için otomatik analiz edilemedi."
        }