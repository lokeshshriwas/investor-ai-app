# Investor AI

An AI-powered investment advisory app for Indian equities (Nifty 50), built for a 48-hour hackathon.

## What it does

- **Stock Screener** (Phase 2): Filter Nifty 50 stocks by PE, ROE, debt-to-equity, and other fundamentals
- **AI Chat Advisor** (Phase 3): Ask natural-language questions about any screened stock - powered by Groq (LLaMA) or Gemini
- **Offline-first data**: All 50 Nifty 50 tickers cached as JSON from Yahoo Finance so the demo works without live API calls

---

## Project Structure

```
investor-ai/
├── frontend/           # Next.js 14 (App Router, TypeScript, Tailwind, shadcn)
├── backend/
│   ├── main.py         # FastAPI app - start here
│   ├── services/
│   │   └── data_fetcher.py   # yfinance cache layer
│   ├── data/
│   │   ├── nifty50.json      # 50 NSE tickers in Yahoo Finance .NS format
│   │   └── cache/            # {ticker}.json files (populated by data_fetcher)
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

---

## Running Locally

### Backend

```bash
cd backend

# First time only - create virtualenv and install deps
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # Mac/Linux

pip install -r requirements.txt

# Copy env template and fill in your real keys
cp .env.example .env

# Start the API server
uvicorn main:app --reload
# → http://localhost:8000/health should return {"status":"ok"}
# → http://localhost:8000/docs   shows the interactive Swagger UI
```

### Frontend

```bash
cd frontend

# Copy env template and fill in your real values
cp .env.local.example .env.local

npm install
npm run dev
# → http://localhost:3000
```

### Populate the stock data cache (run once, or refresh when data is stale)

```bash
cd backend
.\venv\Scripts\activate
python -m services.data_fetcher
# Fetches all 50 Nifty 50 stocks and writes JSON to data/cache/
```

---

## Manual Setup Checklist

> **These steps require external accounts - the agent cannot do them for you.**

- [ ] **Supabase**: Create a project at [supabase.com](https://supabase.com).
  Copy `Project URL` and `service_role` key → paste into `backend/.env`.
  Copy `Project URL` and `anon` key → paste into `frontend/.env.local`.

- [ ] **Groq API Key**: Sign up at [console.groq.com](https://console.groq.com).
  Copy the key → paste as `GROQ_API_KEY` in `backend/.env`.

- [ ] **Gemini API Key**: Get one at [aistudio.google.com](https://aistudio.google.com/apikey).
  Copy the key → paste as `GEMINI_API_KEY` in `backend/.env`.

- [ ] **Alpha Vantage** *(optional, Phase 2 fallback)*: Register at
  [alphavantage.co](https://www.alphavantage.co/support/#api-key).
  Copy the key → paste as `ALPHA_VANTAGE_API_KEY` in `backend/.env`.

- [ ] **Verify Nifty 50 list**: The file `backend/data/nifty50.json` was generated
  from training data and **may not reflect the latest index composition** - NSE
  updates the Nifty 50 periodically. Please verify against the [official NSE page](https://www.nseindia.com/products-services/indices-nifty50-index)
  and update the JSON if any tickers have changed.

---

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 - Foundation | Monorepo, FastAPI skeleton, yfinance cache, design tokens | ✅ Done |
| 2 - Screening | Stock screener UI, filter logic, Supabase storage | 🔜 Next |
| 3 - AI Chat | Groq/Gemini chat, portfolio advice, RAG | 🔜 Later |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.11+, FastAPI, uvicorn |
| Data | yfinance (Yahoo Finance), cached as local JSON |
| LLM (Phase 2+) | Groq (LLaMA 3), Google Gemini |
| Database | Supabase (PostgreSQL) |
| Auth (Phase 2+) | Supabase Auth |
