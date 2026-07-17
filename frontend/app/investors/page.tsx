import Link from "next/link";
import InvestorCard from "@/components/InvestorCard";

type InvestorKey = "buffett" | "lynch" | "graham" | "munger" | "dalio";

interface Investor {
  key: InvestorKey;
  name: string;
  philosophy: string;
  knownFor: string;
  risk: "Low" | "Medium" | "Medium-High";
  riskColor: string;
  historicalNote: string;
}

const INVESTORS: Investor[] = [
  {
    key: "buffett",
    name: "Warren Buffett",
    philosophy: "Buy wonderful companies at fair prices and hold them forever. Moat, margins, and management.",
    knownFor: "Berkshire Hathaway, compounding over decades",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~20% annualised returns over 50+ years",
  },
  {
    key: "lynch",
    name: "Peter Lynch",
    philosophy: "Invest in what you know. Find growth at a reasonable price - PEG ratio is your best friend.",
    knownFor: "Fidelity Magellan Fund, 29.2% avg annual return",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "29.2% avg returns over 13 years at Magellan",
  },
  {
    key: "graham",
    name: "Benjamin Graham",
    philosophy: "Buy only when the price is significantly below intrinsic value. Safety margin above everything.",
    knownFor: "Father of value investing, The Intelligent Investor",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "Deep value, margin of safety focus",
  },
  {
    key: "munger",
    name: "Charlie Munger",
    philosophy: "Quality at a fair price beats bargains every time. Seek businesses with durable competitive advantages.",
    knownFor: "Berkshire Vice Chairman, mental models framework",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "Partnered to achieve Berkshire's legendary returns",
  },
  {
    key: "dalio",
    name: "Ray Dalio",
    philosophy: "Balance risk across assets. Understand macro cycles - debt, inflation, and central banks drive everything.",
    knownFor: "Bridgewater Associates, All-Weather Portfolio",
    risk: "Medium-High",
    riskColor: "var(--negative)",
    historicalNote: "~12% annualised at Bridgewater's Pure Alpha",
  },
];

export default function InvestorsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "32px 24px 28px",
          textAlign: "center",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "16px",
          }}
        >
          Back to home
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
          Choose Your Investor
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "480px", margin: "0 auto" }}>
          Each legend has a unique lens on what makes a great stock. Pick the
          philosophy that resonates with you.
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "40px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {INVESTORS.map((inv) => (
          <Link
            key={inv.key}
            href={`/screener/${inv.key}`}
            style={{ textDecoration: "none" }}
          >
            <InvestorCard
              investorKey={inv.key}
              name={inv.name}
              philosophy={inv.philosophy}
              knownFor={inv.knownFor}
              risk={inv.risk}
              riskColor={inv.riskColor}
              historicalNote={inv.historicalNote}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
