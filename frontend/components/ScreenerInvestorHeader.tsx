"use client";

import { useState } from "react";
import InvestorAvatar from "./InvestorAvatar";

interface ScreenerInvestorHeaderProps {
  investorKey: string;
  investorName: string;
  historicalNote: string;
  philosophy: string;
  risk: string;
  riskColor: string;
  stockCount: number;
}

export default function ScreenerInvestorHeader({
  investorKey,
  investorName,
  historicalNote,
  philosophy,
  risk,
  riskColor,
  stockCount,
}: ScreenerInvestorHeaderProps) {
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);

  // On mobile/touch: tap toggles the full info; on desktop: hover controls it
  const showDetails = hovered || touched;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "20px 24px 24px",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <a
          href="/investors"
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "16px",
          }}
        >
          All investors
        </a>

        {/* Hover zone — the interactive investor info block */}
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onTouchStart={() => setTouched((t) => !t)}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "20px",
            cursor: "default",
            userSelect: "none",
          }}
          aria-label={`${investorName} — hover or tap to see philosophy`}
        >
          {/* Avatar — shrinks slightly on hover */}
          <div
            style={{
              flexShrink: 0,
              transition: "transform 250ms ease",
              transform: showDetails ? "scale(0.82)" : "scale(1)",
              transformOrigin: "bottom left",
            }}
          >
            <InvestorAvatar investorKey={investorKey} size={72} />
          </div>

          {/* Info panel — fades/slides in on hover */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              opacity: showDetails ? 1 : 0,
              transform: showDetails ? "translateX(0)" : "translateX(-8px)",
              transition: "opacity 250ms ease, transform 250ms ease",
              pointerEvents: showDetails ? "auto" : "none",
            }}
          >
            {/* Name + risk badge row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {investorName}
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "99px",
                  border: `1px solid ${riskColor}`,
                  color: riskColor,
                  whiteSpace: "nowrap",
                }}
              >
                {risk} Risk
              </span>
            </div>
            {/* Philosophy blurb */}
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {philosophy}
            </p>
          </div>

          {/* Always-visible: historical returns + stock count (at rest state) */}
          <div
            style={{
              flexShrink: 0,
              textAlign: "right",
              opacity: showDetails ? 0.5 : 1,
              transition: "opacity 250ms ease",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--accent)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {historicalNote}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                margin: "2px 0 0",
              }}
            >
              {stockCount} stocks ranked
            </p>
          </div>
        </div>

        {/* Touch hint — only shown on non-hover devices when detail is hidden */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            marginTop: "10px",
            opacity: touched ? 0 : 0.6,
            transition: "opacity 250ms ease",
          }}
          aria-hidden="true"
        >
          Tap the avatar to see {investorName.split(" ")[0]}&apos;s philosophy
        </p>
      </div>
    </div>
  );
}
