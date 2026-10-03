from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.services.jury_service import jury_service
from app.api import (
    event,
    about,
    domains,
    schedule,
    rules,
    faqs,
    sponsors,
    contact,
    registrations,
    testimonials,
    settings as settings_api,
    posters,
    results,
    juries
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize connection pool and pre-warm domain aliases cache
    db.get_client()
    try:
        await jury_service._refresh_aliases_cache()
    except Exception as e:
        print(f"[Lifespan Startup Notice] Domain aliases pre-warm: {e}")
    yield
    # Shutdown: gracefully close persistent connections
    await db.close()

app = FastAPI(
    title="PRAGATHI 2K26 Admin Backend API",
    description="FastAPI REST API for PRAGATHI 2K26 Expo Admin & Content Management",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for React frontend
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "https://pragathi20-sruin.vercel.app",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(event.router)
app.include_router(about.router)
app.include_router(domains.router)
app.include_router(schedule.router)
app.include_router(rules.router)
app.include_router(faqs.router)
app.include_router(sponsors.router)
app.include_router(contact.router)
app.include_router(registrations.router)
app.include_router(testimonials.router)
app.include_router(settings_api.router)
app.include_router(posters.router)
app.include_router(results.router)
app.include_router(juries.router)

@app.get("/")
@app.get("/api")
async def root():
    return {
        "status": "online",
        "service": "PRAGATHI 2K26 FastAPI Backend API",
        "docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok"}
