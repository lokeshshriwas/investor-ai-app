import Link from "next/link";
import { fetchScreened } from "@/lib/api";
import type { InvestorKey } from "@/lib/api";
import StockCard from "@/components/StockCard";

const INVESTOR_NAMES: Record<string, string> = {
  buffett: "Warren Buffett",
  lynch: "Peter Lynch",
  graham: "Benjamin Graham",
  munger: "Charlie Munger",
  dalio: "Ray Dalio",
};

const VALID_KEYS = new Set(["buffett", "lynch", "graham", "munger", "dalio"]);

interface PageProps {
  params: Promise<{ investor: string }>;
}

export default async function ScreenerPage({ params }: PageProps) {
  const { investor } = await params;

  if (!VALID_KEYS.has(investor)) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", background: "var(--bg)", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
          Unknown investor
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
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
    errorMsg = err instanceof Error ? err.message : "Failed to load screened stocks.";
  }

  if (errorMsg) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", background: "var(--bg)", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>
          Could not load stocks
        </h1>
        <p style={{ color: "var(--negative)", fontSize: "14px", maxWidth: "400px", margin: "0 auto 24px" }}>
          {errorMsg}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Make sure the backend is running at{" "}
          <code style={{ background: "var(--surface)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
            {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
          </code>
        </p>
        <Link href="/investors" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Choose a different investor
        </Link>
      </div>
    );
  }

  const investorName = INVESTOR_NAMES[investor] ?? investor;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "24px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <Link
            href="/investors"
            style={{ fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none" }}
          >
            All investors
          </Link>
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginTop: "8px", marginBottom: "4px" }}>
            {investorName}&apos;s Top Picks
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            {data?.count ?? 0} stocks scored and ranked - highest match first
          </p>
        </div>
      </div>

      {/* Stock list */}
      <div style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        {data?.stocks.map((stock, i) => (
          <StockCard key={stock.symbol} stock={stock} rank={i + 1} investor={investor} />
        ))}
      </div>

      {/* Chat CTA */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px 48px" }}>
        <div className="surface" style={{ padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
            Want to understand the reasoning behind these picks?
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Chat with {investorName} - in their own voice.
          </p>
          <Link
            href={`/chat/${investor}`}
            style={{
              display: "inline-block",
              padding: "10px 24px",
              background: "var(--accent)",
              color: "var(--accent-foreground)",
              borderRadius: "var(--radius)",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Chat with {investorName}
          </Link>
        </div>
      </div>
    </div>
  );
}
