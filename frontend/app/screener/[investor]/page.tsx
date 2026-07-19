import Link from "next/link";
import { fetchScreened } from "@/lib/api";
import type { InvestorKey } from "@/lib/api";
import StockCard from "@/components/StockCard";
import ScreenerInvestorHeader from "@/components/ScreenerInvestorHeader";
import FloatingChatButton from "@/components/FloatingChatButton";

// ── Investor metadata used by the hover header ────────────────────────────────

interface InvestorMeta {
  name: string;
  philosophy: string;
  risk: string;
  riskColor: string;
  historicalNote: string;
}

const INVESTOR_META: Record<string, InvestorMeta> = {
  buffett: {
    name: "Warren Buffett",
    philosophy:
      "Buy wonderful companies at fair prices and hold them forever. Moat, margins, and management.",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~20% CAGR",
  },
  lynch: {
    name: "Peter Lynch",
    philosophy:
      "Invest in what you know. Find growth at a reasonable price — PEG ratio is your best friend.",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "29.2% avg",
  },
  graham: {
    name: "Benjamin Graham",
    philosophy:
      "Buy only when the price is significantly below intrinsic value. Safety margin above everything.",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "Deep value focus",
  },
  munger: {
    name: "Charlie Munger",
    philosophy:
      "Quality at a fair price beats bargains every time. Seek durable competitive advantages.",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "Berkshire CAGR",
  },
  dalio: {
    name: "Ray Dalio",
    philosophy:
      "Balance risk across assets. Understand macro cycles — debt, inflation, and central banks drive everything.",
    risk: "Medium-High",
    riskColor: "var(--negative)",
    historicalNote: "~12% CAGR",
  },
  fisher: {
    name: "Philip Fisher",
    philosophy:
      "Great businesses are found through deep qualitative research — 'scuttlebutt.' Growth quality trumps cheapness.",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~20%+ CAGR",
  },
  templeton: {
    name: "John Templeton",
    philosophy:
      "Buy at points of maximum pessimism, globally. Contrarian value investing anywhere in the world.",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~15% CAGR",
  },
  marks: {
    name: "Howard Marks",
    philosophy:
      "Understand risk before thinking about return. Market cycles and second-order thinking matter most.",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~19% gross",
  },
  greenblatt: {
    name: "Joel Greenblatt",
    philosophy:
      "The magic formula: rank stocks by earnings yield and return on capital. Buy the top, stick to the system.",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~40% CAGR",
  },
  klarman: {
    name: "Seth Klarman",
    philosophy:
      "Margin of safety is non-negotiable. Only buy when the price is so low that being wrong won't hurt you much.",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~20% net CAGR",
  },
  pabrai: {
    name: "Mohnish Pabrai",
    philosophy:
      "Clone the best investors, make low-risk high-uncertainty bets, concentrate when convinced.",
    risk: "Medium-High",
    riskColor: "var(--negative)",
    historicalNote: "~26% gross CAGR",
  },
  cundill: {
    name: "Peter Cundill",
    philosophy:
      "Hunt for stocks trading below liquidation value globally. Patience and extreme cheapness are the only requirements.",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~17% CAGR",
  },
  terrysmith: {
    name: "Terry Smith",
    philosophy:
      "Buy good companies, don't overpay, then do nothing. Quality compounders held forever beat everything else.",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~15% CAGR",
  },
  jhunjhunwala: {
    name: "Rakesh Jhunjhunwala",
    philosophy:
      "Bold, high-conviction bets on India's long-term growth story. Demographics, rising incomes, domestic consumption.",
    risk: "High",
    riskColor: "#e07d3a",
    historicalNote: "~30%+ CAGR",
  },
  damani: {
    name: "Radhakishan Damani",
    philosophy:
      "Disciplined long-term value with operational focus. Low debt, strong unit economics, businesses that compound quietly.",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~40%+ CAGR",
  },
};

const VALID_KEYS = new Set(Object.keys(INVESTOR_META));

interface PageProps {
  params: Promise<{ investor: string }>;
}

export default async function ScreenerPage({ params }: PageProps) {
  const { investor } = await params;

  if (!VALID_KEYS.has(investor)) {
    return (
      <div
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: "var(--bg)",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
          Unknown investor
        </h1>
        <p
          style={{ color: "var(--text-secondary)", marginBottom: "24px" }}
        >
          &quot;{investor}&quot; is not a valid investor key.
        </p>
        <Link href="/investors" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Back to investor selection
        </Link>
      </div>
    );
  }

  let data;
  let errorMsg: string | null = null;

  try {
    data = await fetchScreened(investor as InvestorKey);
  } catch (err) {
    errorMsg =
      err instanceof Error ? err.message : "Failed to load screened stocks.";
  }

  if (errorMsg) {
    return (
      <div
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: "var(--bg)",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>
          Could not load stocks
        </h1>
        <p
          style={{
            color: "var(--negative)",
            fontSize: "14px",
            maxWidth: "400px",
            margin: "0 auto 24px",
          }}
        >
          {errorMsg}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginBottom: "16px",
          }}
        >
          Make sure the backend is running at{" "}
          <code
            style={{
              background: "var(--surface)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
          </code>
        </p>
        <Link
          href="/investors"
          style={{ color: "var(--accent)", fontWeight: 600 }}
        >
          Choose a different investor
        </Link>
      </div>
    );
  }

  const meta = INVESTOR_META[investor]!;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hover-reveal investor header */}
      <ScreenerInvestorHeader
        investorKey={investor}
        investorName={meta.name}
        historicalNote={meta.historicalNote}
        philosophy={meta.philosophy}
        risk={meta.risk}
        riskColor={meta.riskColor}
        stockCount={data?.count ?? 0}
      />

      {/* Stock list */}
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "32px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {data?.stocks.map((stock, i) => (
          <StockCard key={stock.symbol} stock={stock} rank={i + 1} investor={investor} />
        ))}
      </div>

      {/* Fixed floating chat button */}
      <FloatingChatButton
        investorKey={investor}
        chatHref={`/chat/${investor}`}
        hasStockContext={false}
      />
    </div>
  );
}
