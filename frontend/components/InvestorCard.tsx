"use client";

import { useEffect, useRef, useState } from "react";
import InvestorAvatar from "./InvestorAvatar";

interface InvestorCardProps {
  investorKey: string;
  name: string;
  philosophy: string;
  knownFor: string;
  risk: "Low" | "Medium" | "Medium-High" | "High";
  riskColor: string;
  historicalNote: string;
  showLoginHint?: boolean;
  index?: number;
}

export default function InvestorCard({
  investorKey,
  name,
  risk,
  riskColor,
  historicalNote,
  philosophy,
  knownFor,
  showLoginHint = false,
  index = 0,
}: InvestorCardProps) {
  const [hovered, setHovered] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatDismissed, setChatDismissed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Intersection Observer: show chat bubble on first viewport entry ───────
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !chatDismissed) {
            chatTimerRef.current = setTimeout(() => {
              setChatVisible(true);
              chatTimerRef.current = setTimeout(() => {
                setChatVisible(false);
                setChatDismissed(true);
              }, 4000);
            }, index * 180);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    };
  }, [index, chatDismissed]);

  const firstName = name.split(" ")[0];

  const QUIPS: Record<string, string> = {
    buffett: "Ask me about moats",
    lynch: "Invest in what you know!",
    graham: "Safety margin is everything",
    munger: "Invert, always invert",
    dalio: "Know your macro cycles",
    fisher: "Quality over cheapness",
    templeton: "Buy maximum pessimism",
    marks: "Understand risk first",
    greenblatt: "Magic formula works!",
    klarman: "Margin of safety or bust",
    pabrai: "Clone the best minds",
    cundill: "Below liquidation value?",
    terrysmith: "Buy good, hold forever",
    jhunjhunwala: "India's growth story 🇮🇳",
    damani: "Quiet compounding wins",
  };
  const quip = QUIPS[investorKey] ?? "Ask me about investing!";

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => {
        setHovered(true);
        if (chatVisible) {
          setChatVisible(false);
          setChatDismissed(true);
        }
      }}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", height: "100%" }}
    >
      {/* ── Chat bubble ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden={!chatVisible}
        style={{
          position: "absolute",
          top: "-52px",
          left: "20px",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          pointerEvents: "none",
          opacity: chatVisible ? 1 : 0,
          transform: chatVisible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.9)",
          transition: "opacity 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
        }}
      >
        <div
          style={{
            background: "var(--accent)",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 600,
            padding: "7px 13px",
            borderRadius: "14px 14px 14px 4px",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(217,119,87,0.5)",
          }}
        >
          {quip}
        </div>
        <div
          style={{
            width: 0,
            height: 0,
            marginLeft: "14px",
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid var(--accent)",
          }}
        />
      </div>

      {/* ── Card shell ───────────────────────────────────────────────────────── */}
      <div
        className="surface"
        style={{
          cursor: "pointer",
          // Fixed card height of 420px keeps the grid completely stable (no row expansion jitter)
          height: "420px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--accent)"
            : "0 4px 12px rgba(0,0,0,0.25)",
          transition: "transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.3s ease",
          padding: "24px 20px 20px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface)";
        }}
      >
        {/* Risk badge — top-right corner of card, always visible */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: "99px",
              border: `1px solid ${riskColor}`,
              color: riskColor,
              background: "var(--surface)",
            }}
          >
            {risk}
          </span>
        </div>

        {/* ── Center Zone (Avatar + Name + Return Pill) ── */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            paddingTop: hovered ? "4px" : "16px",
            // Slower, smoother spring timing
            transition: "padding 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)",
          }}
        >
          {/* Radial glow background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 50% 50%, rgba(217,119,87,0.08) 0%, transparent 70%)",
              opacity: hovered ? 0.6 : 1,
              transition: "opacity 0.6s ease",
              pointerEvents: "none",
            }}
          />

          {/* Avatar — shrinks with subtle delay & smooth transition */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              transform: hovered ? "scale(0.7)" : "scale(1)",
              transformOrigin: "center center",
              borderRadius: "50%",
              boxShadow: hovered
                ? "0 4px 12px rgba(0,0,0,0.3)"
                : "0 0 0 5px rgba(217,119,87,0.35), 0 0 0 10px rgba(217,119,87,0.12), 0 10px 28px rgba(0,0,0,0.45)",
              // Added delay to scale for the gradual, premium effect
              transition: "transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) 0.05s, box-shadow 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
          >
            <InvestorAvatar investorKey={investorKey} size={110} />
          </div>

          {/* Name + Return Pill — shrinks slightly on hover, remains stable */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              marginTop: "16px",
              textAlign: "center",
              transition: "transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
          >
            <p
              style={{
                fontSize: hovered ? "13.5px" : "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 6px",
                lineHeight: 1.2,
                transition: "font-size 0.5s ease",
              }}
            >
              {name}
            </p>
            <span
              style={{
                display: "inline-block",
                fontSize: hovered ? "10px" : "11px",
                fontWeight: 600,
                color: "var(--accent)",
                background: "rgba(217,119,87,0.15)",
                border: "1px solid rgba(217,119,87,0.35)",
                borderRadius: "99px",
                padding: hovered ? "2px 8px" : "3px 11px",
                transition: "font-size 0.5s ease, padding 0.5s ease",
              }}
            >
              {historicalNote}
            </span>
          </div>
        </div>

        {/* ── Detail Panel (Philosophy + Known For + CTA Button) ── */}
        <div
          style={{
            maxHeight: hovered ? "220px" : "0px",
            overflow: "hidden",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(12px)",
            // Slower, highly-tuned easing curves
            transition: "max-height 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.5s ease 0.05s, transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) 0.05s",
          }}
        >
          <div
            style={{
              paddingTop: "14px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Philosophy */}
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

            {/* Known For */}
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                margin: 0,
                opacity: 0.75,
              }}
            >
              {knownFor}
            </p>

            {/* CTA Footer */}
            <div
              style={{
                paddingTop: "10px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Screen with {firstName}
              </span>

              {showLoginHint ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Login to screen
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--accent)",
                    fontWeight: 700,
                  }}
                >
                  Screen →
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
