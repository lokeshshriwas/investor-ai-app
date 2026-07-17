from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Investor AI API",
    description="AI-powered investment advisory backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ─────────────────────────────────────────────
# Phase 2 TODOs (do not implement yet)
# ─────────────────────────────────────────────
# TODO: Mount /api/v1/screen   – stock screening endpoint
# TODO: Mount /api/v1/chat     – Groq/Gemini chat endpoint (needs GROQ_API_KEY / GEMINI_API_KEY)
# TODO: Mount /api/v1/stocks   – CRUD for cached stock data
# TODO: Add Supabase auth middleware (needs SUPABASE_URL / SUPABASE_SERVICE_KEY)
