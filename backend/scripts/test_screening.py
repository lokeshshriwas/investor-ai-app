"""
test_screening.py
-----------------
Sanity-check the investor screening logic against all cached Nifty 50 stocks.

Usage (from backend/ directory):
    python scripts/test_screening.py

Prints the top 10 for each investor and a brief summary table.
"""

import sys
import io
from pathlib import Path

# Force UTF-8 on Windows consoles that default to cp1252
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Ensure the backend root is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.screening import screen_stocks, load_all_cached_stocks, VALID_INVESTOR_KEYS


def fmt_val(v) -> str:
    if v is None:
        return "N/A"
    if isinstance(v, float):
        return f"{v:.2f}"
    return str(v)


def print_divider(char="-", width=90):
    print(char * width)


def main():
    print()
    print("=" * 90)
    print("  INVESTOR SCREENING TEST  --  Nifty 50")
    print("=" * 90)

    all_stocks = load_all_cached_stocks()
    print(f"\n  Loaded {len(all_stocks)} stocks from cache.\n")

    if not all_stocks:
        print("  [ERROR] No cached stocks found! Run services/data_fetcher.py first.")
        sys.exit(1)

    for investor_key in VALID_INVESTOR_KEYS:
        print()
        print_divider("=")
        print(f"  INVESTOR: {investor_key.upper()}")
        print_divider("=")

        top10 = screen_stocks(investor_key, all_stocks, top_n=10)

        if not top10:
            print(f"  [WARN] No scoreable stocks for '{investor_key}'.")
            continue

        # Header
        print(
            f"  {'#':<3}  {'Symbol':<18} {'Name':<32} {'Score':>6}  "
            f"{'P/E':>6}  {'ROE':>6}  {'D/E':>6}  {'Margin':>8}"
        )
        print_divider()

        for i, s in enumerate(top10, 1):
            name = (s.get("name") or "-")[:30]
            pe   = fmt_val(s.get("pe_ratio"))
            roe  = fmt_val(s.get("roe"))
            de   = fmt_val(s.get("debt_to_equity"))
            pm   = fmt_val(s.get("profit_margin"))
            score = f"{s['score']:.1f}"

            print(
                f"  {i:<3}  {s['symbol']:<18} {name:<32} {score:>6}  "
                f"{pe:>6}  {roe:>6}  {de:>6}  {pm:>8}"
            )

    print()
    print("=" * 90)
    print("  [OK] Screening test complete.")
    print("=" * 90)
    print()


if __name__ == "__main__":
    main()
