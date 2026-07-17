"""
tests/test_screening.py
-----------------------
Unit tests for each of the 5 investor scoring functions.

For each scorer we verify:
  - A "great fit" stock scores higher than a "bad fit" stock
  - A stock with missing fields doesn't crash, and returns a score (partial)
  - A stock with ALL fields None returns None (no data)
  - Comparison direction is correct (e.g. lower P/E -> higher score for Buffett)
"""

import pytest
from services.screening import (
    score_buffett,
    score_graham,
    score_lynch,
    score_munger,
    score_dalio,
    screen_stocks,
    VALID_INVESTOR_KEYS,
)

# ---------------------------------------------------------------------------
# Fixture stock dictionaries
# ---------------------------------------------------------------------------

# All fields provided as yfinance decimal fractions
GREAT_BUFFETT = {
    "symbol": "MOCK_GREAT",
    "pe_ratio": 8.0,        # very low P/E -- Buffett loves this
    "roe": 0.25,            # 25% ROE as decimal fraction
    "debt_to_equity": 0.3,  # low D/E
    "profit_margin": 0.18,  # 18% margin as fraction
    "market_cap": 2e12,
}

BAD_BUFFETT = {
    "symbol": "MOCK_BAD",
    "pe_ratio": 80.0,       # very high P/E
    "roe": 0.03,            # 3% ROE
    "debt_to_equity": 2.5,  # high D/E
    "profit_margin": 0.02,  # 2% margin
    "market_cap": 2e12,
}

# Stock missing 2-3 fields
PARTIAL_STOCK = {
    "symbol": "MOCK_PARTIAL",
    "pe_ratio": 12.0,
    "profit_margin": 0.15,
    # roe, debt_to_equity, peg_ratio, revenue_growth all missing
}

# Stock with ALL scoring fields None
EMPTY_STOCK = {
    "symbol": "MOCK_EMPTY",
    "pe_ratio": None,
    "roe": None,
    "debt_to_equity": None,
    "profit_margin": None,
    "peg_ratio": None,
    "revenue_growth": None,
    "market_cap": None,
}

# Great fit for Lynch: low PEG, high revenue growth, small-cap
GREAT_LYNCH = {
    "symbol": "MOCK_LYNCH_GREAT",
    "peg_ratio": 0.4,
    "revenue_growth": 0.35,  # 35% growth
    "market_cap": 1e11,      # small-cap
}

BAD_LYNCH = {
    "symbol": "MOCK_LYNCH_BAD",
    "peg_ratio": 5.0,        # very high PEG
    "revenue_growth": -0.05, # negative growth
    "market_cap": 1e13,      # mega-cap
}

# Great fit for Graham: very low P/E, low D/E, decent margin, good ROE
GREAT_GRAHAM = {
    "symbol": "MOCK_GRAHAM_GREAT",
    "pe_ratio": 6.0,
    "debt_to_equity": 0.2,
    "profit_margin": 0.12,
    "roe": 0.18,
}

BAD_GRAHAM = {
    "symbol": "MOCK_GRAHAM_BAD",
    "pe_ratio": 50.0,
    "debt_to_equity": 3.0,
    "profit_margin": 0.02,
    "roe": 0.04,
}

# Great Munger: very high ROE, high margin, low D/E
GREAT_MUNGER = {
    "symbol": "MOCK_MUNGER_GREAT",
    "roe": 0.35,
    "profit_margin": 0.30,
    "debt_to_equity": 0.1,
}

BAD_MUNGER = {
    "symbol": "MOCK_MUNGER_BAD",
    "roe": 0.03,
    "profit_margin": 0.02,
    "debt_to_equity": 5.0,
}

# Great Dalio: very low D/E, good margin, mega-cap
GREAT_DALIO = {
    "symbol": "MOCK_DALIO_GREAT",
    "debt_to_equity": 0.1,
    "profit_margin": 0.20,
    "market_cap": 6e12,  # mega-cap
}

BAD_DALIO = {
    "symbol": "MOCK_DALIO_BAD",
    "debt_to_equity": 4.0,
    "profit_margin": -0.05,  # negative margin
    "market_cap": 5e10,     # small-cap
}


# ---------------------------------------------------------------------------
# Buffett scorer tests
# ---------------------------------------------------------------------------

class TestScoreBuffett:
    def test_great_beats_bad(self):
        assert score_buffett(GREAT_BUFFETT) > score_buffett(BAD_BUFFETT)

    def test_lower_pe_gives_higher_score(self):
        low_pe = {**GREAT_BUFFETT, "pe_ratio": 5.0}
        high_pe = {**GREAT_BUFFETT, "pe_ratio": 28.0}
        assert score_buffett(low_pe) > score_buffett(high_pe)

    def test_higher_roe_gives_higher_score(self):
        high_roe = {**GREAT_BUFFETT, "roe": 0.30}
        low_roe  = {**GREAT_BUFFETT, "roe": 0.05}
        assert score_buffett(high_roe) > score_buffett(low_roe)

    def test_lower_de_gives_higher_score(self):
        low_de  = {**GREAT_BUFFETT, "debt_to_equity": 0.1}
        high_de = {**GREAT_BUFFETT, "debt_to_equity": 1.5}
        assert score_buffett(low_de) > score_buffett(high_de)

    def test_partial_stock_returns_score_not_none(self):
        result = score_buffett(PARTIAL_STOCK)
        assert result is not None
        assert 0 <= result <= 100

    def test_empty_stock_returns_none(self):
        assert score_buffett(EMPTY_STOCK) is None

    def test_score_in_range(self):
        result = score_buffett(GREAT_BUFFETT)
        assert result is not None
        assert 0 <= result <= 100

    def test_no_crash_on_negative_pe(self):
        stock = {**GREAT_BUFFETT, "pe_ratio": -5.0}
        result = score_buffett(stock)
        assert result is not None  # should not crash


# ---------------------------------------------------------------------------
# Lynch scorer tests
# ---------------------------------------------------------------------------

class TestScoreLynch:
    def test_great_beats_bad(self):
        assert score_lynch(GREAT_LYNCH) > score_lynch(BAD_LYNCH)

    def test_lower_peg_higher_score(self):
        low_peg  = {**GREAT_LYNCH, "peg_ratio": 0.3}
        high_peg = {**GREAT_LYNCH, "peg_ratio": 1.8}
        assert score_lynch(low_peg) > score_lynch(high_peg)

    def test_higher_growth_higher_score(self):
        high_rg = {**GREAT_LYNCH, "revenue_growth": 0.4}
        low_rg  = {**GREAT_LYNCH, "revenue_growth": 0.05}
        assert score_lynch(high_rg) > score_lynch(low_rg)

    def test_small_cap_beats_mega_cap(self):
        small = {**GREAT_LYNCH, "market_cap": 1e11}
        mega  = {**GREAT_LYNCH, "market_cap": 1e13}
        assert score_lynch(small) > score_lynch(mega)

    def test_negative_peg_excluded(self):
        """Negative PEG (company losing money) should not score."""
        stock = {**GREAT_LYNCH, "peg_ratio": -1.0}
        # s_peg should be None for negative PEG, score still comes from rg+mc
        result = score_lynch(stock)
        assert result is not None  # should not crash

    def test_partial_stock_returns_score(self):
        # PARTIAL_STOCK has no Lynch-relevant fields (peg/revenue_growth/market_cap),
        # so we use a Lynch-specific partial stock with at least market_cap present.
        partial_lynch = {"symbol": "MOCK", "market_cap": 1e11}
        result = score_lynch(partial_lynch)
        assert result is not None

    def test_empty_stock_returns_none(self):
        assert score_lynch(EMPTY_STOCK) is None


# ---------------------------------------------------------------------------
# Graham scorer tests
# ---------------------------------------------------------------------------

class TestScoreGraham:
    def test_great_beats_bad(self):
        assert score_graham(GREAT_GRAHAM) > score_graham(BAD_GRAHAM)

    def test_lower_pe_higher_score(self):
        low_pe  = {**GREAT_GRAHAM, "pe_ratio": 5.0}
        high_pe = {**GREAT_GRAHAM, "pe_ratio": 18.0}
        assert score_graham(low_pe) > score_graham(high_pe)

    def test_partial_stock_returns_score(self):
        result = score_graham(PARTIAL_STOCK)
        assert result is not None

    def test_empty_stock_returns_none(self):
        assert score_graham(EMPTY_STOCK) is None

    def test_score_in_range(self):
        result = score_graham(GREAT_GRAHAM)
        assert result is not None
        assert 0 <= result <= 100


# ---------------------------------------------------------------------------
# Munger scorer tests
# ---------------------------------------------------------------------------

class TestScoreMunger:
    def test_great_beats_bad(self):
        assert score_munger(GREAT_MUNGER) > score_munger(BAD_MUNGER)

    def test_higher_roe_higher_score(self):
        high_roe = {**GREAT_MUNGER, "roe": 0.40}
        low_roe  = {**GREAT_MUNGER, "roe": 0.05}
        assert score_munger(high_roe) > score_munger(low_roe)

    def test_empty_stock_returns_none(self):
        assert score_munger(EMPTY_STOCK) is None

    def test_partial_stock_returns_score(self):
        result = score_munger(PARTIAL_STOCK)
        assert result is not None


# ---------------------------------------------------------------------------
# Dalio scorer tests
# ---------------------------------------------------------------------------

class TestScoreDalio:
    def test_great_beats_bad(self):
        assert score_dalio(GREAT_DALIO) > score_dalio(BAD_DALIO)

    def test_lower_de_higher_score(self):
        low_de  = {**GREAT_DALIO, "debt_to_equity": 0.1}
        high_de = {**GREAT_DALIO, "debt_to_equity": 3.0}
        assert score_dalio(low_de) > score_dalio(high_de)

    def test_large_cap_beats_small_cap(self):
        large = {**GREAT_DALIO, "market_cap": 5e12}
        small = {**GREAT_DALIO, "market_cap": 1e10}
        assert score_dalio(large) > score_dalio(small)

    def test_empty_stock_returns_none(self):
        assert score_dalio(EMPTY_STOCK) is None

    def test_partial_stock_returns_score(self):
        result = score_dalio(PARTIAL_STOCK)
        assert result is not None


# ---------------------------------------------------------------------------
# screen_stocks() function tests
# ---------------------------------------------------------------------------

class TestScreenStocks:
    STOCKS = [
        {**GREAT_BUFFETT, "symbol": "GREAT"},
        {**BAD_BUFFETT,   "symbol": "BAD"},
        {**PARTIAL_STOCK, "symbol": "PARTIAL"},
        EMPTY_STOCK,
    ]

    def test_returns_list(self):
        result = screen_stocks("buffett", self.STOCKS)
        assert isinstance(result, list)

    def test_descending_order(self):
        result = screen_stocks("buffett", self.STOCKS)
        scores = [s["score"] for s in result]
        assert scores == sorted(scores, reverse=True)

    def test_top_n_capped(self):
        result = screen_stocks("buffett", self.STOCKS, top_n=2)
        assert len(result) <= 2

    def test_fewer_stocks_than_top_n(self):
        """screen_stocks should not crash when fewer stocks score than top_n."""
        result = screen_stocks("buffett", [GREAT_BUFFETT], top_n=10)
        assert len(result) == 1

    def test_empty_input_returns_empty(self):
        result = screen_stocks("buffett", [])
        assert result == []

    def test_all_empty_stocks_returns_empty(self):
        """When all stocks return None score, result should be empty."""
        result = screen_stocks("buffett", [EMPTY_STOCK, EMPTY_STOCK])
        assert result == []

    def test_invalid_investor_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown investor"):
            screen_stocks("soros", self.STOCKS)

    def test_each_result_has_score_field(self):
        result = screen_stocks("buffett", self.STOCKS)
        for s in result:
            assert "score" in s
            assert isinstance(s["score"], float)

    def test_all_valid_investor_keys_work(self):
        for key in VALID_INVESTOR_KEYS:
            result = screen_stocks(key, self.STOCKS)
            assert isinstance(result, list)

    def test_great_ranked_before_bad(self):
        result = screen_stocks("buffett", self.STOCKS)
        symbols = [s["symbol"] for s in result]
        assert symbols.index("GREAT") < symbols.index("BAD")

    def test_de_normalisation_percentage_form(self):
        """
        D/E values > 10 are treated as percentage points by yfinance.
        A stock with D/E=50 (meaning 0.5 ratio) should score better than
        D/E=150 (meaning 1.5 ratio).
        """
        stock_low_de  = {**GREAT_BUFFETT, "debt_to_equity": 50.0}   # 0.5 as %
        stock_high_de = {**GREAT_BUFFETT, "debt_to_equity": 150.0}  # 1.5 as %
        assert score_buffett(stock_low_de) > score_buffett(stock_high_de)

    def test_roe_decimal_fraction_normalised(self):
        """
        ROE=0.28 (28%) should be treated the same as ROE=28 after normalisation.
        """
        stock_frac = {**GREAT_BUFFETT, "roe": 0.28}
        stock_pct  = {**GREAT_BUFFETT, "roe": 28.0}
        # Both should give the same score (both normalise to 28%)
        assert abs(score_buffett(stock_frac) - score_buffett(stock_pct)) < 0.1
