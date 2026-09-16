from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_db_client() -> Client:
    try:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return supabase
    except Exception as e:
        logger.error(f"Supabase bağlantı hatası: {e}")
        raise e

# Uygulama genelinde kullanılacak tekil (singleton) DB nesnesi
db = get_db_client()