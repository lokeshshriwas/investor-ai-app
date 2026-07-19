import Link from "next/link";
import { fetchStock } from "@/lib/api";
import type { StockDetail } from "@/lib/api";
import FloatingChatButton from "@/components/FloatingChatButton";


function fmt(v: number | null | undefined, suffix = ""): string {
  if (v == null) return "-";
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T${suffix}`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B${suffix}`;
  return `${v.toFixed(2)}${suffix}`;
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "-";
  const val = Math.abs(v) <= 1 ? v * 100 : v;
  return `${val.toFixed(1)}%`;
}

/** Build a rich stock_context string passed to the chat endpoint */
export function buildStockContext(stock: StockDetail): string {
  const parts = [
    `Stock: ${stock.symbol.replace(".NS", "")} - ${stock.name ?? ""}`,
    stock.sector ? `Sector: ${stock.sector}` : null,
    stock.current_price != null ? `Price: ₹${stock.current_price.toLocaleString("en-IN")}` : null,
    stock.market_cap != null ? `Market Cap: ${fmt(stock.market_cap, " ₹")}` : null,
    stock.pe_ratio != null ? `P/E: ${stock.pe_ratio.toFixed(2)}` : null,
    stock.peg_ratio != null ? `PEG: ${stock.peg_ratio.toFixed(2)}` : null,
    stock.roe != null ? `ROE: ${fmtPct(stock.roe)}` : null,
    stock.debt_to_equity != null ? `D/E: ${stock.debt_to_equity.toFixed(2)}` : null,
    stock.profit_margin != null ? `Profit Margin: ${fmtPct(stock.profit_margin)}` : null,
    stock.revenue_growth != null ? `Revenue Growth: ${fmtPct(stock.revenue_growth)}` : null,
  ].filter(Boolean);
  return parts.join(" | ");
}

interface StatBlock {
  label: string;
  value: string;
  hint?: string;
}

function StatCard({ label, value, hint }: StatBlock) {
  return (
    <div className="surface" style={{ padding: "18px 20px" }}>
      <p style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: "6px",
      }}>
        {label}
      </p>
      <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
        {value}
      </p>
      {hint && (
        <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface PageProps {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ investor?: string }>;
}

export default async function StockDetailPage({ params, searchParams }: PageProps) {
  const { symbol } = await params;
  const { investor } = await searchParams;

  let stock: StockDetail | null = null;
  let errorMsg: string | null = null;

  try {
    stock = await fetchStock(symbol);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      errorMsg = `Stock "${symbol}" was not found in our database.`;
    } else {
      errorMsg = err instanceof Error
        ? err.message
        : "Failed to load stock data. Please try again.";
    }
  }

  if (errorMsg || !stock) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", background: "var(--bg)", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>
          Stock not found
        </h1>
        <p style={{ color: "var(--negative)", fontSize: "14px", maxWidth: "400px", margin: "0 auto 24px" }}>
          {errorMsg}
        </p>
        <Link
          href={investor ? `/screener/${investor}` : "/investors"}
          style={{ color: "var(--accent)", fontWeight: 600 }}
        >
          Back to screener
        </Link>
      </div>
    );
  }

  const cleanSymbol = stock.symbol.replace(".NS", "");

  // Build rich context for chat - encodes real metric values in the URL
  const stockContext = buildStockContext(stock);
  const chatHref = investor
    ? `/chat/${investor}?stock=${encodeURIComponent(stock.symbol)}&ctx=${encodeURIComponent(stockContext)}`
    : null;

  const stats: StatBlock[] = [
    { label: "Current Price", value: stock.current_price != null ? `₹${stock.current_price.toLocaleString("en-IN")}` : "-" },
    { label: "Market Cap", value: fmt(stock.market_cap, " ₹"), hint: "Indian rupees" },
    { label: "P/E Ratio", value: fmt(stock.pe_ratio), hint: "Price to earnings" },
    { label: "PEG Ratio", value: fmt(stock.peg_ratio), hint: "Price/earnings to growth" },
    { label: "ROE", value: fmtPct(stock.roe), hint: "Return on equity" },
    { label: "Debt / Equity", value: stock.debt_to_equity != null ? fmt(stock.debt_to_equity) : "-", hint: "Lower = less leveraged" },
    { label: "Profit Margin", value: fmtPct(stock.profit_margin), hint: "Net profit margin" },
    { label: "Revenue Growth", value: fmtPct(stock.revenue_growth), hint: "Year-over-year" },
  ];

  const pros = stock.pros_cons?.pros ?? [];
  const cons = stock.pros_cons?.cons ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "24px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <Link
            href={investor ? `/screener/${investor}` : "/investors"}
            style={{ fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none" }}
          >
            Back to screener
          </Link>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginTop: "10px",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            <div>
              <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "4px" }}>
                {cleanSymbol}
              </h1>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
                {stock.name}{stock.sector && ` · ${stock.sector}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Stats grid */}
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
          Key Metrics
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "40px",
        }}>
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Pros & Cons */}
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
          AI Analysis
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "40px",
        }}>
          {/* Positives */}
          <div className="surface" style={{ padding: "24px" }}>
            <h3 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--positive)",
              marginBottom: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              Positives
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {pros.length === 0
                ? <li style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No data available.</li>
                : pros.map((pro, i) => (
                  <li key={i} style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    paddingLeft: "14px",
                    borderLeft: "2px solid var(--positive)",
                    color: "var(--text-primary)",
                  }}>
                    {pro}
                  </li>
                ))
              }
            </ul>
          </div>

          {/* Risks */}
          <div className="surface" style={{ padding: "24px" }}>
            <h3 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--negative)",
              marginBottom: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              Risks & Concerns
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {cons.length === 0
                ? <li style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No data available.</li>
                : cons.map((con, i) => (
                  <li key={i} style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    paddingLeft: "14px",
                    borderLeft: "2px solid var(--negative)",
                    color: "var(--text-primary)",
                  }}>
                    {con}
                  </li>
                ))
              }
            </ul>
          </div>
        </div>

      </div>

      {/* Floating chat button — shows if an investor is in context */}
      {chatHref && investor && (
        <FloatingChatButton
          investorKey={investor}
          chatHref={chatHref}
          hasStockContext={true}
        />
      )}
    </div>
  );
}
