"use client";

import InvestorAvatar from "./InvestorAvatar";

interface InvestorCardProps {
  investorKey: string;
  name: string;
  philosophy: string;
  knownFor: string;
  risk: "Low" | "Medium" | "Medium-High";
  riskColor: string;
  historicalNote: string;
}

export default function InvestorCard({
  investorKey,
  name,
  risk,
  riskColor,
  historicalNote,
  philosophy,
  knownFor,
}: InvestorCardProps) {
  return (
    <div
      className="surface"
      style={{
        padding: "24px",
        cursor: "pointer",
        transition: "background-color 0.15s, transform 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface-hover)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface)";
        (e.currentTarget as HTMLDivElement).style.transform = "";
      }}
    >
      {/* Avatar + Risk badge row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <InvestorAvatar investorKey={investorKey} size={56} />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "99px",
            border: `1px solid ${riskColor}`,
            color: riskColor,
          }}
        >
          {risk} Risk
        </span>
      </div>

      {/* Name + note */}
      <div>
        <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "3px", color: "var(--text-primary)" }}>
          {name}
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {historicalNote}
        </p>
      </div>

      {/* Philosophy */}
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          flexGrow: 1,
        }}
      >
        {philosophy}
      </p>

      {/* Footer */}
      <div
        style={{
          padding: "10px 0 0",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {knownFor}
        </span>
        <span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>
          Screen
        </span>
      </div>
    </div>
  );
}
