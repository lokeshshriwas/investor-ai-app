"""
main.py
───────
Investor AI – FastAPI application entry point.

Phase 2: Screening, Stock detail, and Chat endpoints are wired in.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import screen, stocks, chat

app = FastAPI(
    title="Investor AI API",
    description=(
        "AI-powered investment advisory backend for Nifty 50 stocks. "
        "Powered by Groq LLM and Yahoo Finance data."
    ),
    version="0.2.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Phase 5 will update this to the production frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(screen.router,  prefix="/api/v1")
app.include_router(stocks.router,  prefix="/api/v1")
app.include_router(chat.router,    prefix="/api/v1")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Meta"])
def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "version": "0.2.0"}


@app.get("/api/v1/investors", tags=["Meta"])
def list_investors():
    """List all supported investor personas."""
    from prompts.investor_prompts import VALID_INVESTOR_KEYS
    return {"investors": VALID_INVESTOR_KEYS}
