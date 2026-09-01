"""
main.py
───────
Investor AI – FastAPI application entry point.

Phase 2: Screening, Stock detail, and Chat endpoints are wired in.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from routers import screen, stocks, chat

# Rate limiter: default limit 60 requests/minute per IP, chat has stricter limit
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="Investor AI API",
    description=(
        "AI-powered investment advisory backend for Nifty 50 stocks. "
        "Powered by Groq LLM and Yahoo Finance data."
    ),
    version="0.2.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Phase 5 will update this to the production frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://investorai.bylokesh.in"],
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
