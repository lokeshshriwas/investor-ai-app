"""
routers/stocks.py
─────────────────
GET /stock/{symbol}  →  cached stock data + LLM-generated pros/cons
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from services.llm import generate_pros_cons

router = APIRouter(prefix="/stock", tags=["Stocks"])

_CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"


def _load_stock(symbol: str) -> dict:
    """Load a stock from the cache.  Raises 404 if not found."""
    # Accept with or without .NS suffix
    candidates = [symbol.upper(), symbol.upper() + ".NS"]
    for candidate in candidates:
        path = _CACHE_DIR / f"{candidate}.json"
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
    raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found in cache.")


@router.get("/{symbol}")
def get_stock(symbol: str):
    """
    Return cached financial data for a Nifty 50 stock plus an LLM-generated
    pros/cons analysis.

    **symbol** example: `RELIANCE.NS` or `RELIANCE`
    """
    stock = _load_stock(symbol)
    pros_cons = generate_pros_cons(stock)
    return {
        **stock,
        "pros_cons": pros_cons,
    }
