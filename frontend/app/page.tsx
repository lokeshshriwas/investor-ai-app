"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, TrendingUp, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

const features = [
  {
    icon: BarChart2,
    title: "15 Legendary Strategies",
    desc: "Screen stocks through the lens of Buffett, Lynch, Graham, Munger, Dalio, and 10 more investing legends.",
  },
  {
    icon: TrendingUp,
    title: "Top 250 Indian Stocks",
    desc: "Analyze over 250 top Indian companies across all market caps using real fundamental metrics.",
  },
  {
    icon: MessageSquare,
    title: "AI-Powered Insights",
    desc: "Chat with an AI that speaks as your chosen investor - plain language, no jargon.",
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "18px", color: "var(--text-primary)" }}>
          Investor <span style={{ color: "var(--accent)" }}>AI</span>
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          {isLoggedIn === false && (
            <>
              <Link
                href="/login"
                style={{
                  padding: "6px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                style={{
                  padding: "6px 16px",
                  borderRadius: "var(--radius)",
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  fontSize: "14px",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "80px 24px 48px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            display: "inline-block",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
            borderRadius: "99px",
            padding: "4px 12px",
            marginBottom: "24px",
          }}
        >
          Stock · AI Advisory
        </p>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "var(--text-primary)",
            marginBottom: "20px",
          }}
        >
          Pick a legend&apos;s strategy.
          <br />
          <span style={{ color: "var(--accent)" }}>Find your next great stock.</span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "520px",
            margin: "0 auto 40px",
          }}
        >
          Choose an investing legend&apos;s style, get a screened shortlist of
          top Indian stocks, then chat with an AI to understand exactly why each
          one fits - or doesn&apos;t.
        </p>

        <Link
          href="/investors"
          style={{
            display: "inline-block",
            padding: "14px 36px",
            background: "var(--accent)",
            color: "var(--accent-foreground)",
            borderRadius: "var(--radius)",
            fontWeight: 600,
            fontSize: "16px",
            textDecoration: "none",
          }}
        >
          Choose Your Investor
        </Link>

        <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
          Free to explore - no credit card required
        </p>
      </section>

      {/* Feature cards */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="surface"
            style={{ padding: "24px" }}
          >
            <div style={{ marginBottom: "12px", color: "var(--accent)" }}>
              <f.icon size={24} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
              {f.title}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
