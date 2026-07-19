// lib/api.ts
// Typed API client - all backend calls live here.
// Uses NEXT_PUBLIC_API_URL from env.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type InvestorKey =
  | "buffett"
  | "lynch"
  | "graham"
  | "munger"
  | "dalio"
  | "fisher"
  | "templeton"
  | "marks"
  | "greenblatt"
  | "klarman"
  | "pabrai"
  | "cundill"
  | "terrysmith"
  | "jhunjhunwala"
  | "damani";


export interface Stock {
  symbol: string;
  name: string | null;
  current_price: number | null;
  market_cap: number | null;
  sector: string | null;
  pe_ratio: number | null;
  peg_ratio: number | null;
  roe: number | null;
  debt_to_equity: number | null;
  profit_margin: number | null;
  revenue_growth: number | null;
  score?: number;
  investor?: string;
  _fetched_at?: string;
}

export interface ProsConsResult {
  pros: string[];
  cons: string[];
}

export interface StockDetail extends Stock {
  pros_cons: ProsConsResult;
}

export interface ScreenResult {
  investor: string;
  top_n: number;
  count: number;
  stocks: Stock[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  investor: string;
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchScreened(
  investorKey: InvestorKey,
  topN = 10
): Promise<ScreenResult> {
  return apiFetch<ScreenResult>(
    `/api/v1/screen/${investorKey}?top_n=${topN}`
  );
}

export async function fetchStock(symbol: string): Promise<StockDetail> {
  return apiFetch<StockDetail>(`/api/v1/stock/${encodeURIComponent(symbol)}`);
}

export async function postChat(
  investorKey: InvestorKey,
  conversation: ChatMessage[],
  stockContext = ""
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(`/api/v1/chat/${investorKey}`, {
    method: "POST",
    body: JSON.stringify({ conversation, stock_context: stockContext }),
  });
}
