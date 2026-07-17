"""
test_llm.py
───────────
Live integration test for the Groq LLM integration.

Tests:
  1. chat_with_investor for 2 different investor personas (Buffett + Lynch)
  2. generate_pros_cons for a cached Nifty 50 stock (RELIANCE.NS)

Usage (from backend/ directory):
    python scripts/test_llm.py
"""

import json
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.llm import chat_with_investor, generate_pros_cons, get_active_model


DIVIDER = "─" * 80


def load_stock(symbol: str) -> dict:
    cache_dir = Path(__file__).resolve().parent.parent / "data" / "cache"
    path = cache_dir / f"{symbol}.json"
    if not path.exists():
        print(f"  ⚠️  Cache file not found for {symbol}. Returning empty dict.")
        return {"symbol": symbol}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    print()
    print("=" * 80)
    print(f"  GROQ LLM INTEGRATION TEST")
    print(f"  Active model: {get_active_model()}")
    print("=" * 80)

    # ── Test 1: Buffett chat ──────────────────────────────────────────────────
    print()
    print(DIVIDER)
    print("  TEST 1: chat_with_investor - Warren Buffett")
    print(DIVIDER)
    conversation_1 = [
        {
            "role": "user",
            "content": (
                "Warren, should a beginner investor put money into a company with "
                "a very high P/E ratio like 80, if everyone seems excited about it?"
            ),
        }
    ]
    try:
        reply_1 = chat_with_investor("buffett", conversation_1)
        print("\n  [Buffett] →\n")
        for line in reply_1.strip().split("\n"):
            print("  " + line)
        print()
        print("  ✅ Buffett chat: OK")
    except Exception as e:
        print(f"  ❌ Buffett chat FAILED: {e}")

    # ── Test 2: Lynch chat ────────────────────────────────────────────────────
    print()
    print(DIVIDER)
    print("  TEST 2: chat_with_investor - Peter Lynch")
    print(DIVIDER)
    conversation_2 = [
        {
            "role": "user",
            "content": (
                "Peter, my wife loves shopping at a particular retail chain. "
                "Is that a good enough reason to research the stock?"
            ),
        }
    ]
    try:
        reply_2 = chat_with_investor("lynch", conversation_2)
        print("\n  [Lynch] →\n")
        for line in reply_2.strip().split("\n"):
            print("  " + line)
        print()
        print("  ✅ Lynch chat: OK")
    except Exception as e:
        print(f"  ❌ Lynch chat FAILED: {e}")

    # ── Test 3: Pros/cons for RELIANCE.NS ─────────────────────────────────────
    print()
    print(DIVIDER)
    print("  TEST 3: generate_pros_cons - RELIANCE.NS")
    print(DIVIDER)
    stock = load_stock("RELIANCE.NS")
    print(f"\n  Stock loaded: {stock.get('name')} ({stock.get('symbol')})")
    try:
        result = generate_pros_cons(stock)
        print("\n  Pros:")
        for p in result.get("pros", []):
            print(f"    ✔ {p}")
        print("\n  Cons:")
        for c in result.get("cons", []):
            print(f"    ✘ {c}")
        print()
        print("  ✅ pros/cons generation: OK")
        # Validate it's proper JSON structure
        assert isinstance(result["pros"], list) and len(result["pros"]) > 0
        assert isinstance(result["cons"], list) and len(result["cons"]) > 0
        print("  ✅ JSON structure valid")
    except Exception as e:
        print(f"  ❌ pros/cons FAILED: {e}")

    print()
    print("=" * 80)
    print("  LLM tests complete.")
    print("=" * 80)
    print()


if __name__ == "__main__":
    main()
