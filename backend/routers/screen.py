"""
routers/screen.py
─────────────────
GET /screen/{investor_key}  →  top-10 screened stocks for that investor
"""

from fastapi import APIRouter, HTTPException
from services.screening import screen_stocks, VALID_INVESTOR_KEYS

router = APIRouter(prefix="/screen", tags=["Screening"])


@router.get("/{investor_key}")
def get_screened_stocks(investor_key: str, top_n: int = 10):
    """
    Return the top-N Nifty 50 stocks screened through the selected
    investor's scoring model.

    **investor_key** must be one of: `buffett`, `lynch`, `graham`, `munger`, `dalio`
    """
    if investor_key not in VALID_INVESTOR_KEYS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown investor key '{investor_key}'. "
                f"Valid options: {VALID_INVESTOR_KEYS}"
            ),
        )
    results = screen_stocks(investor_key, top_n=top_n)
    return {
        "investor": investor_key,
        "top_n": top_n,
        "count": len(results),
        "stocks": results,
    }
