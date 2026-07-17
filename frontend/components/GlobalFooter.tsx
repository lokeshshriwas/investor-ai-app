"use client";

import { usePathname } from "next/navigation";

export default function GlobalFooter() {
  const pathname = usePathname();

  // Hide footer entirely on chat pages to allow a single pinned scrollbar for messages
  if (pathname?.startsWith("/chat/")) {
    return null;
  }

  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        padding: "16px 24px",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          maxWidth: "720px",
          margin: "0 auto",
          lineHeight: 1.5,
        }}
      >
        <strong>Disclaimer:</strong> Investor AI is for educational
        purposes only. Nothing on this platform constitutes personalised
        financial advice. Always conduct your own research and consult a
        registered financial advisor before making investment decisions.
        Past performance is not indicative of future results.
      </p>
    </footer>
  );
}
