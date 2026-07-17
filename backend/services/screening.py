"""
screening.py
------------
Investor-specific scoring functions for Nifty 50 stocks.

Each scorer returns a float score 0-100, or None if the stock has
absolutely zero usable metrics (extremely rare).  Individual missing
metrics are skipped rather than zeroing the whole score, so stocks
with partial data still rank.

Usage:
    from services.screening import screen_stocks
    top10 = screen_stocks("buffett", all_stocks, top_n=10)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

# -- Paths -------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_CACHE_DIR   = _BACKEND_DIR / "data" / "cache"


# -- Helpers -----------------------------------------------------------------

def _g(stock: dict, key: str) -> Optional[float]:
    """Safely return a numeric metric, or None."""
    val = stock.get(key)
    if val is None:
        return None
    try:
        f = float(val)
        if f != f:  # NaN guard
            return None
        return f
    except (TypeError, ValueError):
        return None


def _score(criteria: list[Optional[float]]) -> Optional[float]:
    """
    Average the non-None sub-scores (each 0-100).
    Returns None only if *every* criterion is None (no usable data at all).
    """
    valid = [c for c in criteria if c is not None]
    if not valid:
        return None
    return sum(valid) / len(valid)


def _clamp(value: float, low: float, high: float) -> float:
    """Linear score: 100 if value <= low (better), 0 if >= high, linear between."""
    if value <= low:
        return 100.0
    if value >= high:
        return 0.0
    return 100.0 * (high - value) / (high - low)


def _clamp_hi(value: float, low: float, high: float) -> float:
    """Inverse linear: 100 if value >= high (better), 0 if <= low, linear between."""
    if value >= high:
        return 100.0
    if value <= low:
        return 0.0
    return 100.0 * (value - low) / (high - low)


# -- Normalisation helpers ----------------------------------------------------
#
# yfinance returns:
#   returnOnEquity  as a decimal fraction  (e.g. 0.28 = 28%)
#   profitMargins   as a decimal fraction  (e.g. 0.18 = 18%)
#   revenueGrowth   as a decimal fraction  (e.g. 0.15 = 15%)
#   debtToEquity    SOMETIMES as raw ratio (e.g. 45.3), SOMETIMES as %
#                   We use > 10 as the heuristic to detect the % form.
#
# BUG FIX (v2): Previously used < 2 to detect decimal ROE/margins, which
# falsely flagged valid ratios like 1.5 (150% ROE).  Correct threshold is
# abs(v) <= 1 for fraction detection.

def _pct(v: float) -> float:
    """Convert a decimal fraction to percentage points if it looks like a fraction."""
    return v * 100.0 if abs(v) <= 1.0 else v


def _de_norm(de: float) -> float:
    """
    Normalise debt-to-equity: yfinance sometimes returns this as percentage
    points (e.g. 45.3 meaning 0.453).  We treat values > 10 as percentage.
    """
    return de / 100.0 if de > 10.0 else de


# -- Market-cap helpers -------------------------------------------------------

def _is_large_cap(mc: Optional[float]) -> bool:
    return mc is not None and mc >= 1e12  # >= INR 1 trillion


def _is_mid_small_cap(mc: Optional[float]) -> bool:
    return mc is not None and mc < 5e11   # < INR 500 billion


# -- Scorer: Warren Buffett ---------------------------------------------------

def score_buffett(stock: dict) -> Optional[float]:
    """
    Low P/E (<15), high ROE (>15%), low D/E (<0.5), strong profit margin (>10%).
    Direction: low P/E = better, high ROE = better, low D/E = better, high margin = better.
    """
    pe  = _g(stock, "pe_ratio")
    roe = _g(stock, "roe")
    de  = _g(stock, "debt_to_equity")
    pm  = _g(stock, "profit_margin")

    # P/E: lower is better; full score <= 5, zero >= 30
    s_pe = _clamp(pe, 5, 30) if pe is not None else None

    # ROE: higher is better; 0% -> 0, >=30% -> 100
    s_roe = _clamp_hi(_pct(roe), 0, 30) if roe is not None else None

    # D/E: lower is better; 0 -> 100, >=1 -> 0
    s_de = _clamp(_de_norm(de), 0, 1) if de is not None else None

    # Profit margin: higher is better; 0% -> 0, >=30% -> 100
    s_pm = _clamp_hi(_pct(pm), 0, 30) if pm is not None else None

    return _score([s_pe, s_roe, s_de, s_pm])


# -- Scorer: Peter Lynch ------------------------------------------------------

def score_lynch(stock: dict) -> Optional[float]:
    """
    PEG between 0-1, revenue growth >15%, mid/small-cap bias.
    """
    peg = _g(stock, "peg_ratio")
    rg  = _g(stock, "revenue_growth")
    mc  = _g(stock, "market_cap")

    # PEG: ideal 0-1; score 100 at PEG=0 declining to 0 at PEG=2
    s_peg = None
    if peg is not None and peg > 0:
        s_peg = min(_clamp(peg, 0, 2) * 1.5, 100.0)

    # Revenue growth: higher is better; -10% -> 0, >=40% -> 100
    s_rg = _clamp_hi(_pct(rg), -10, 40) if rg is not None else None

    # Mid/small-cap bonus
    s_mc = None
    if mc is not None:
        if mc < 2e11:     s_mc = 100.0   # small-cap
        elif mc < 5e11:   s_mc = 85.0    # mid-cap
        elif mc < 2e12:   s_mc = 60.0    # large-cap
        else:             s_mc = 30.0    # mega-cap (penalty)

    return _score([s_peg, s_rg, s_mc])


# -- Scorer: Benjamin Graham --------------------------------------------------

def score_graham(stock: dict) -> Optional[float]:
    """
    Very low P/E (<12), low debt (<0.4), decent margin (>8%), ROE >10%.
    """
    pe  = _g(stock, "pe_ratio")
    de  = _g(stock, "debt_to_equity")
    pm  = _g(stock, "profit_margin")
    roe = _g(stock, "roe")

    # P/E: lower is better; full score <= 4, zero >= 20
    s_pe = _clamp(pe, 4, 20) if pe is not None else None

    # D/E: lower is better
    s_de = _clamp(_de_norm(de), 0, 0.8) if de is not None else None

    # Profit margin: higher is better; 0% -> 0, >=25% -> 100
    s_pm = _clamp_hi(_pct(pm), 0, 25) if pm is not None else None

    # ROE: higher is better; 5% -> 0, >=25% -> 100
    s_roe = _clamp_hi(_pct(roe), 5, 25) if roe is not None else None

    return _score([s_pe, s_de, s_pm, s_roe])


# -- Scorer: Charlie Munger ---------------------------------------------------

def score_munger(stock: dict) -> Optional[float]:
    """
    High ROE (>18%), high margin (>15%), moderate debt (<0.6).
    Quality-at-a-fair-price emphasis.
    """
    roe = _g(stock, "roe")
    pm  = _g(stock, "profit_margin")
    de  = _g(stock, "debt_to_equity")

    # ROE: higher is better; 5% -> 0, >=35% -> 100
    s_roe = _clamp_hi(_pct(roe), 5, 35) if roe is not None else None

    # Profit margin: higher is better; 5% -> 0, >=40% -> 100
    s_pm = _clamp_hi(_pct(pm), 5, 40) if pm is not None else None

    # D/E: lower is better; 0 -> 100, >=1.2 -> 0
    s_de = _clamp(_de_norm(de), 0, 1.2) if de is not None else None

    return _score([s_roe, s_pm, s_de])


# -- Scorer: Ray Dalio --------------------------------------------------------

def score_dalio(stock: dict) -> Optional[float]:
    """
    Low debt (<0.7), positive margin, large-cap stability bias.
    Macro risk-parity oriented -- favours resilient balance sheets.
    """
    de  = _g(stock, "debt_to_equity")
    pm  = _g(stock, "profit_margin")
    mc  = _g(stock, "market_cap")

    # D/E: lower is better; 0 -> 100, >=1.5 -> 0
    s_de = _clamp(_de_norm(de), 0, 1.5) if de is not None else None

    # Profit margin: higher is better; -5% -> 0, >=25% -> 100
    s_pm = _clamp_hi(_pct(pm), -5, 25) if pm is not None else None

    # Large-cap stability bonus
    s_mc = None
    if mc is not None:
        if mc >= 5e12:    s_mc = 100.0   # mega-cap
        elif mc >= 2e12:  s_mc = 85.0    # large-cap
        elif mc >= 5e11:  s_mc = 60.0    # mid-cap
        else:             s_mc = 25.0    # small-cap (higher risk)

    return _score([s_de, s_pm, s_mc])


# -- Registry -----------------------------------------------------------------

_SCORERS: dict[str, Any] = {
    "buffett": score_buffett,
    "lynch":   score_lynch,
    "graham":  score_graham,
    "munger":  score_munger,
    "dalio":   score_dalio,
}

VALID_INVESTOR_KEYS = list(_SCORERS.keys())


# -- Public API ---------------------------------------------------------------

def load_all_cached_stocks() -> list[dict]:
    """Read every *.json file from data/cache/ and return as a list of dicts."""
    stocks: list[dict] = []
    for path in sorted(_CACHE_DIR.glob("*.json")):
        try:
            with open(path, encoding="utf-8") as f:
                stocks.append(json.load(f))
        except Exception:
            pass  # skip corrupt files
    return stocks


def screen_stocks(
    investor_key: str,
    all_stocks: Optional[list[dict]] = None,
    top_n: int = 10,
) -> list[dict]:
    """
    Score all stocks with the requested investor's scorer and return the
    top_n descending by score.

    Parameters
    ----------
    investor_key : one of 'buffett' | 'lynch' | 'graham' | 'munger' | 'dalio'
    all_stocks   : pre-loaded list of stock dicts; if None, loads from cache
    top_n        : how many top stocks to return (clamped to len of scored list)

    Returns
    -------
    list of dicts, each being the original stock dict augmented with:
        {"score": float, "investor": investor_key}
    """
    if investor_key not in _SCORERS:
        raise ValueError(
            f"Unknown investor '{investor_key}'. "
            f"Valid keys: {VALID_INVESTOR_KEYS}"
        )

    scorer = _SCORERS[investor_key]

    if all_stocks is None:
        all_stocks = load_all_cached_stocks()

    scored: list[dict] = []
    for stock in all_stocks:
        s = scorer(stock)
        if s is not None:
            scored.append({**stock, "score": round(s, 2), "investor": investor_key})

    scored.sort(key=lambda x: x["score"], reverse=True)
    # top_n is automatically handled by slice even if len(scored) < top_n
    return scored[:top_n]
