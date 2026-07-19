"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InvestorCard from "@/components/InvestorCard";
import { supabase } from "@/lib/supabase";

type InvestorKey =
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

interface Investor {
  key: InvestorKey;
  name: string;
  philosophy: string;
  knownFor: string;
  risk: "Low" | "Medium" | "Medium-High" | "High";
  riskColor: string;
  historicalNote: string;
}

const INVESTORS: Investor[] = [
  // ── Original 5 ──────────────────────────────────────────────────────────
  {
    key: "buffett",
    name: "Warren Buffett",
    philosophy:
      "Buy wonderful companies at fair prices and hold them forever. Moat, margins, and management.",
    knownFor: "Berkshire Hathaway, compounding over decades",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~20% CAGR over 50+ years",
  },
  {
    key: "lynch",
    name: "Peter Lynch",
    philosophy:
      "Invest in what you know. Find growth at a reasonable price — PEG ratio is your best friend.",
    knownFor: "Fidelity Magellan Fund, 29.2% avg annual return",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "29.2% avg returns over 13 years",
  },
  {
    key: "graham",
    name: "Benjamin Graham",
    philosophy:
      "Buy only when the price is significantly below intrinsic value. Safety margin above everything.",
    knownFor: "Father of value investing, The Intelligent Investor",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "Deep value, margin of safety focus",
  },
  {
    key: "munger",
    name: "Charlie Munger",
    philosophy:
      "Quality at a fair price beats bargains every time. Seek businesses with durable competitive advantages.",
    knownFor: "Berkshire Vice Chairman, mental models framework",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "Partnered to achieve Berkshire's legendary returns",
  },
  {
    key: "dalio",
    name: "Ray Dalio",
    philosophy:
      "Balance risk across assets. Understand macro cycles — debt, inflation, and central banks drive everything.",
    knownFor: "Bridgewater Associates, All-Weather Portfolio",
    risk: "Medium-High",
    riskColor: "var(--negative)",
    historicalNote: "~12% CAGR at Bridgewater Pure Alpha",
  },

  // ── 10 New Investors ─────────────────────────────────────────────────────
  {
    key: "fisher",
    name: "Philip Fisher",
    philosophy:
      "Great businesses are found through deep qualitative research — 'scuttlebutt.' Growth quality trumps current cheapness.",
    knownFor: "Common Stocks and Uncommon Profits, growth investing pioneer",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~20%+ long-term CAGR on concentrated positions",
  },
  {
    key: "templeton",
    name: "John Templeton",
    philosophy:
      "Buy at points of maximum pessimism, globally. Contrarian value investing anywhere in the world.",
    knownFor: "Templeton Growth Fund, global contrarian value",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~15% CAGR over 38 years at Templeton Growth Fund",
  },
  {
    key: "marks",
    name: "Howard Marks",
    philosophy:
      "Understand risk before thinking about return. Market cycles and second-order thinking matter most.",
    knownFor: "Oaktree Capital, Memo-writer on risk and cycles",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~19% gross returns at Oaktree distressed debt",
  },
  {
    key: "greenblatt",
    name: "Joel Greenblatt",
    philosophy:
      "The magic formula: rank stocks by earnings yield and return on capital. Buy the top, stick to the system.",
    knownFor: "Gotham Capital, The Little Book That Beats the Market",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~40% annualised at Gotham (1985-2006)",
  },
  {
    key: "klarman",
    name: "Seth Klarman",
    philosophy:
      "Margin of safety is non-negotiable. Only buy when the price is so low that being wrong won't hurt you much.",
    knownFor: "Baupost Group, Margin of Safety book",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~20% net CAGR at Baupost over 40 years",
  },
  {
    key: "pabrai",
    name: "Mohnish Pabrai",
    philosophy:
      "Clone the best investors, make low-risk high-uncertainty bets, concentrate when you're convinced.",
    knownFor: "Pabrai Investment Funds, The Dhandho Investor",
    risk: "Medium-High",
    riskColor: "var(--negative)",
    historicalNote: "~26% gross CAGR from 1999 through 2018",
  },
  {
    key: "cundill",
    name: "Peter Cundill",
    philosophy:
      "Hunt for stocks trading below liquidation value globally. Patience and extreme cheapness are the only requirements.",
    knownFor: "Cundill Value Fund, global deep value investor",
    risk: "Medium",
    riskColor: "var(--accent)",
    historicalNote: "~17% CAGR over 33 years at Cundill Value Fund",
  },
  {
    key: "terrysmith",
    name: "Terry Smith",
    philosophy:
      "Buy good companies, don't overpay, then do nothing. Quality compounders held forever beat everything else.",
    knownFor: "Fundsmith Equity Fund, blunt British quality investor",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~15% CAGR at Fundsmith since 2010",
  },
  {
    key: "jhunjhunwala",
    name: "Rakesh Jhunjhunwala",
    philosophy:
      "Bold, high-conviction bets on India's long-term growth story. Demographics, rising incomes, and domestic consumption.",
    knownFor: "India's Big Bull, Titan, Indian Hotels, HDFC bets",
    risk: "High",
    riskColor: "#e07d3a",
    historicalNote: "~30%+ CAGR over career in Indian markets",
  },
  {
    key: "damani",
    name: "Radhakishan Damani",
    philosophy:
      "Disciplined long-term value with operational focus. Low debt, strong unit economics, businesses that compound quietly.",
    knownFor: "DMart (Avenue Supermarts), quiet Indian value legend",
    risk: "Low",
    riskColor: "var(--positive)",
    historicalNote: "~40%+ CAGR over decades (DMart + portfolio)",
  },
];

export default function InvestorsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

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
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "15px",
            maxWidth: "480px",
            margin: "0 auto",
          }}
        >
          15 legendary investors, each with a distinct lens on what makes a great
          stock. Pick the philosophy that resonates with you.
        </p>

        {/* Login nudge for unauthenticated users */}
        {isLoggedIn === false && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "16px",
              padding: "8px 16px",
              background: "rgba(217,119,87,0.12)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--radius)",
              fontSize: "13px",
              color: "var(--accent)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>
              <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
                Log in
              </Link>
              {" "}or{" "}
              <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
                sign up
              </Link>
              {" "}to access stock screeners
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          maxWidth: "1040px",
          margin: "0 auto",
          padding: "40px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "20px",
        }}
      >
        {INVESTORS.map((inv, i) => (
          <Link
            key={inv.key}
            href={
              isLoggedIn === false
                ? `/login?redirect=${encodeURIComponent(`/screener/${inv.key}`)}`
                : `/screener/${inv.key}`
            }
            style={{ textDecoration: "none" }}
          >
            <InvestorCard
              investorKey={inv.key}
              name={inv.name}
              philosophy={inv.philosophy}
              knownFor={inv.knownFor}
              risk={inv.risk as "Low" | "Medium" | "Medium-High" | "High"}
              riskColor={inv.riskColor}
              historicalNote={inv.historicalNote}
              showLoginHint={isLoggedIn === false}
              index={i}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
