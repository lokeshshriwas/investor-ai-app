"use client";

import Link from "next/link";
import type { Stock } from "@/lib/api";

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "-";
  return v.toFixed(decimals);
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "-";
  const val = Math.abs(v) <= 1 ? v * 100 : v;
  return `${val.toFixed(1)}%`;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "var(--positive)"
      : score >= 50 ? "var(--accent)"
        : "var(--text-secondary)";
  return (
    <span style={{ fontWeight: 700, fontSize: "22px", color }}>
      {score.toFixed(0)}
      <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-secondary)", marginLeft: "2px" }}>/100</span>
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "68px",
        padding: "5px 10px",
        background: "var(--bg)",
        borderRadius: "6px",
        border: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "2px", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
    </span>
  );
}

/** Derive a short plain-language reasoning line based on which key criteria pass */
function getReasoning(stock: Stock, investor: string): string {
  const reasons: string[] = [];
  const pe = stock.pe_ratio;
  const roe = stock.roe != null ? (Math.abs(stock.roe) <= 1 ? stock.roe * 100 : stock.roe) : null;
  const margin = stock.profit_margin != null ? (Math.abs(stock.profit_margin) <= 1 ? stock.profit_margin * 100 : stock.profit_margin) : null;
  const de = stock.debt_to_equity;
  const peg = stock.peg_ratio;
  const growth = stock.revenue_growth != null ? (Math.abs(stock.revenue_growth) <= 1 ? stock.revenue_growth * 100 : stock.revenue_growth) : null;
  const mcap = stock.market_cap;

  if (investor === "buffett" || investor === "munger") {
    if (pe != null && pe > 0 && pe < 20) reasons.push(`Low P/E (${pe.toFixed(1)})`);
    if (roe != null && roe > 15) reasons.push(`Strong ROE (${roe.toFixed(1)}%)`);
    if (margin != null && margin > 10) reasons.push(`Healthy margin (${margin.toFixed(1)}%)`);
    if (de != null && de < 0.5) reasons.push("Low leverage");
  } else if (investor === "lynch") {
    if (peg != null && peg > 0 && peg < 1.5) reasons.push(`Low PEG (${peg.toFixed(2)})`);
    if (growth != null && growth > 15) reasons.push(`High growth (${growth.toFixed(1)}%)`);
    if (mcap != null && mcap < 5e10) reasons.push("Small/mid cap");
  } else if (investor === "graham") {
    if (pe != null && pe > 0 && pe < 15) reasons.push(`Low P/E (${pe.toFixed(1)})`);
    if (de != null && de < 1) reasons.push("Conservative leverage");
    if (margin != null && margin > 5) reasons.push(`Positive margin (${margin.toFixed(1)}%)`);
  } else if (investor === "dalio") {
    if (de != null && de < 2) reasons.push("Manageable debt");
    if (mcap != null && mcap > 1e10) reasons.push("Large-cap stability");
    if (growth != null && growth > 5) reasons.push(`Growing revenue (${growth.toFixed(1)}%)`);
  }

  if (reasons.length === 0) return "Relative fit vs. peer universe";
  return reasons.join(" · ");
}

export default function StockCard({
  stock,
  rank,
  investor,
}: {
  stock: Stock;
  rank: number;
  investor: string;
}) {
  const symbol = stock.symbol.replace(".NS", "");
  const detailHref = `/stock/${stock.symbol}?investor=${investor}`;
  const reasoning = getReasoning(stock, investor);

  return (
    <Link href={detailHref} style={{ textDecoration: "none" }}>
      <div
        className="surface"
        style={{
          padding: "18px 22px",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          cursor: "pointer",
          transition: "background-color 0.12s",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface-hover)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface)")
        }
      >
        {/* Rank */}
        <span style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          minWidth: "20px",
        }}>
          {rank}
        </span>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "start", minWidth: "52px", marginTop: "5px" }}>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1px", lineHeight: 1 }}>Score</span>
          <ScoreBadge score={stock.score ?? 0} />
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>{symbol}</span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {stock.name ?? ""}
            </span>
            {stock.sector && (
              <span style={{
                fontSize: "11px",
                padding: "2px 7px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "99px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
              }}>
                {stock.sector}
              </span>
            )}
          </div>

          {/* Reasoning line */}
          <p style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "10px", lineHeight: 1.4 }}>
            {reasoning}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <MetricPill label="P/E" value={fmt(stock.pe_ratio)} />
            <MetricPill label="ROE" value={fmtPct(stock.roe)} />
            <MetricPill label="Margin" value={fmtPct(stock.profit_margin)} />
            {stock.current_price != null && (
              <MetricPill label="Price" value={`₹${stock.current_price.toLocaleString("en-IN")}`} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
