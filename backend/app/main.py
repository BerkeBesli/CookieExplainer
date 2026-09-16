# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(title="CookieExplainer API", version="1.0.0")

# Chrome eklentisinden (farklı bir origin) gelen isteklere izin veren CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # MVP aşamasında her yerden gelen isteğe açık
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Yazdığımız rotayı ana uygulamaya "/api/v1" ön ekiyle dahil ediyoruz
app.include_router(api_router, prefix="/api/v1")

# Sunucunun ayakta olup olmadığını test etmek için basit bir kök dizin
@app.get("/")
def read_root():
    return {"status": "ok", "message": "CookieExplainer API çalışıyor."}