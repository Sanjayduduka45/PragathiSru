import os
import sys
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("ENV", "development").lower() != "production"
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=reload)
