"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import InvestorAvatar from "./InvestorAvatar";

/** Short first name / common name used in the tooltip */
const INVESTOR_FIRST_NAMES: Record<string, string> = {
  buffett:      "Warren",
  lynch:        "Peter",
  graham:       "Benjamin",
  munger:       "Charlie",
  dalio:        "Ray",
  fisher:       "Philip",
  templeton:    "John",
  marks:        "Howard",
  greenblatt:   "Joel",
  klarman:      "Seth",
  pabrai:       "Mohnish",
  cundill:      "Peter C.",
  terrysmith:   "Terry",
  jhunjhunwala: "Rakesh",
  damani:       "Damani",
};

interface FloatingChatButtonProps {
  /** The investor key, e.g. "buffett" */
  investorKey: string;
  /** Full chat URL, including ?stock=&ctx= params if on stock page */
  chatHref: string;
  /** If true, tooltip says "Chat with X about this stock"; otherwise "Chat with X" */
  hasStockContext?: boolean;
}

export default function FloatingChatButton({
  investorKey,
  chatHref,
  hasStockContext = false,
}: FloatingChatButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  // Hide this button entirely when already on the chat page
  if (pathname?.startsWith("/chat/")) return null;

  const firstName = INVESTOR_FIRST_NAMES[investorKey] ?? investorKey;
  const tooltipText = hasStockContext
    ? `Chat with ${firstName} about this stock`
    : `Chat with ${firstName}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px",
      }}
    >
      {/* Tooltip — appears above the button on hover */}
      <div
        aria-hidden={!hovered}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "6px 12px",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0) scale(1)" : "translateY(6px) scale(0.96)",
          transition: "opacity 200ms ease, transform 200ms ease",
          pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {tooltipText}
      </div>

      {/* Circular avatar button */}
      <button
        id={`floating-chat-btn-${investorKey}`}
        aria-label={tooltipText}
        onClick={() => router.push(chatHref)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          padding: 0,
          border: "2px solid var(--accent)",
          cursor: "pointer",
          background: "transparent",
          overflow: "hidden",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          boxShadow: hovered
            ? "0 0 0 4px rgba(217,119,87,0.25), 0 8px 24px rgba(0,0,0,0.4)"
            : "0 4px 16px rgba(0,0,0,0.3)",
          transition: "transform 200ms ease, box-shadow 200ms ease",
          flexShrink: 0,
        }}
      >
        <InvestorAvatar investorKey={investorKey} size={60} />
      </button>
    </div>
  );
}
