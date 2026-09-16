from pydantic import BaseModel
from typing import List

# Eklentiden API'ye gelecek isteğin formatı
class AnalyzeRequest(BaseModel):
    domain: str
    cookies: List[str]
    policy_text: str

# API'den eklentiye dönecek yanıtın formatı
class AnalyzeResponse(BaseModel):
    domain: str
    privacy_score: float
    grade: str
    summary: str
    technical_cookies: dict
    discrepancies: List[str]
    source: str # Analizin nereden geldiğini belirten kısım: "cache" veya "live_analysis"