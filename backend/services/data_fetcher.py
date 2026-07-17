"""
data_fetcher.py
───────────────
Pulls key financial metrics from Yahoo Finance via yfinance and caches them
as JSON files in data/cache/{ticker}.json.

Usage (standalone):
    python -m services.data_fetcher            # fetches all Nifty 50 tickers
    python -c "from services.data_fetcher import fetch_and_cache_stock; fetch_and_cache_stock('RELIANCE.NS')"

Phase 2 TODOs:
    # TODO: Add Alpha Vantage fallback when yfinance returns None for a field
    # TODO: Add Supabase upsert after local cache write (needs SUPABASE_URL / SUPABASE_SERVICE_KEY)
"""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yfinance as yf

# ── Paths ────────────────────────────────────────────────────────────────────
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_CACHE_DIR = _BACKEND_DIR / "data" / "cache"
_NIFTY50_FILE = _BACKEND_DIR / "data" / "nifty50.json"

_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _safe_get(info: dict, key: str) -> Any:
    """Return info[key] or None — never raises."""
    try:
        val = info.get(key)
        # yfinance sometimes returns 'None' string or inf
        if val in (None, float("inf"), float("-inf")):
            return None
        return val
    except Exception:
        return None


def fetch_and_cache_stock(ticker: str) -> dict:
    """
    Fetch key financial metrics for *ticker* from Yahoo Finance and write
    them to data/cache/{ticker}.json.

    Returns the cached dict on success.
    Raises RuntimeError with a descriptive message on hard failures.
    """
    cache_path = _CACHE_DIR / f"{ticker}.json"

    try:
        stock = yf.Ticker(ticker)
        info: dict = stock.info or {}
    except Exception as exc:
        raise RuntimeError(f"yfinance failed for {ticker}: {exc}") from exc

    # Gracefully extract every field — None if unavailable
    data = {
        "symbol":          ticker,
        "name":            _safe_get(info, "longName") or _safe_get(info, "shortName"),
        "current_price":   _safe_get(info, "currentPrice") or _safe_get(info, "regularMarketPrice"),
        "market_cap":      _safe_get(info, "marketCap"),
        "sector":          _safe_get(info, "sector"),
        "pe_ratio":        _safe_get(info, "trailingPE"),
        "peg_ratio":       _safe_get(info, "pegRatio"),
        "roe":             _safe_get(info, "returnOnEquity"),
        "debt_to_equity":  _safe_get(info, "debtToEquity"),
        "profit_margin":   _safe_get(info, "profitMargins"),
        "revenue_growth":  _safe_get(info, "revenueGrowth"),
        "_fetched_at":     datetime.now(timezone.utc).isoformat(),
    }

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return data


# == CLI runner: fetch ALL Nifty 50 tickers ===================================
if __name__ == "__main__":
    with open(_NIFTY50_FILE, encoding="utf-8") as f:
        tickers: list[str] = json.load(f)

    total = len(tickers)
    successes: list[str] = []
    failures: list[tuple[str, str]] = []

    print()
    print("-" * 55)
    print(f"  Fetching {total} Nifty 50 tickers from Yahoo Finance")
    print("-" * 55)
    print()

    for i, ticker in enumerate(tickers, 1):
        try:
            data = fetch_and_cache_stock(ticker)
            price = data.get("current_price")
            name = (data.get("name") or "-")[:30]
            print(f"  [{i:02d}/{total}] OK   {ticker:<18} {name:<30}  Rs.{price}")
            successes.append(ticker)
        except Exception as exc:
            reason = str(exc)
            print(f"  [{i:02d}/{total}] FAIL {ticker:<18} {reason[:60]}")
            failures.append((ticker, reason))

        # Small delay to be polite to Yahoo Finance rate limits
        time.sleep(0.4)

    print()
    print("-" * 55)
    print(f"  Succeeded : {len(successes)}/{total}")
    print(f"  Failed    : {len(failures)}/{total}")
    if failures:
        print()
        print("  Failed tickers:")
        for sym, reason in failures:
            print(f"    * {sym}: {reason[:80]}")
    print("-" * 55)
    print()
    print(f"  Cache written to: {_CACHE_DIR}")
    print()
