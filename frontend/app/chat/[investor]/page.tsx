"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { postChat } from "@/lib/api";
import type { ChatMessage, InvestorKey } from "@/lib/api";
import InvestorAvatar from "@/components/InvestorAvatar";

const INVESTOR_NAMES: Record<string, string> = {
  buffett:      "Warren Buffett",
  lynch:        "Peter Lynch",
  graham:       "Benjamin Graham",
  munger:       "Charlie Munger",
  dalio:        "Ray Dalio",
  fisher:       "Philip Fisher",
  templeton:    "John Templeton",
  marks:        "Howard Marks",
  greenblatt:   "Joel Greenblatt",
  klarman:      "Seth Klarman",
  pabrai:       "Mohnish Pabrai",
  cundill:      "Peter Cundill",
  terrysmith:   "Terry Smith",
  jhunjhunwala: "Rakesh Jhunjhunwala",
  damani:       "Radhakishan Damani",
};

const STARTER_QUESTIONS: Record<string, string[]> = {
  buffett: [
    "What makes a company worth holding forever?",
    "How do you think about valuation?",
    "What is your biggest investing lesson?",
  ],
  lynch: [
    "How do I spot a multi-bagger early?",
    "What is the PEG ratio and why does it matter?",
    "Can everyday investors beat the market?",
  ],
  graham: [
    "How do I calculate intrinsic value?",
    "What is margin of safety?",
    "How should a beginner start in value investing?",
  ],
  munger: [
    "What is a mental model and how do I use one?",
    "Why do you prefer quality over cheapness?",
    "What mistakes do most investors make?",
  ],
  dalio: [
    "How does the economic machine work?",
    "What is the All-Weather portfolio?",
    "How should I think about debt cycles?",
  ],
  fisher: [
    "What is scuttlebutt research and how do I do it?",
    "How do you evaluate management quality?",
    "Why hold a stock for decades instead of selling on good news?",
  ],
  templeton: [
    "What does buying at maximum pessimism actually look like?",
    "How do you invest when everyone else is panicking?",
    "Why look for value outside your home country?",
  ],
  marks: [
    "How should I think about investment risk?",
    "What are market cycles and how do they affect my portfolio?",
    "What is second-level thinking?",
  ],
  greenblatt: [
    "How does the magic formula work?",
    "What is earnings yield and why does it matter?",
    "Why do most investors underperform the market?",
  ],
  klarman: [
    "What is margin of safety and how do I calculate it?",
    "How do you decide when a stock is cheap enough to buy?",
    "What is the most common mistake investors make with risk?",
  ],
  pabrai: [
    "What does a low-risk high-uncertainty bet look like?",
    "How do you clone another investor's idea without just copying blindly?",
    "How many stocks should I own in a portfolio?",
  ],
  cundill: [
    "How do you value a company trading below its liquidation value?",
    "Why look internationally for deep value?",
    "How patient do you have to be as a value investor?",
  ],
  terrysmith: [
    "What makes a company a true quality compounder?",
    "Why is unnecessary trading so destructive to returns?",
    "How do you identify financial engineering disguised as growth?",
  ],
  jhunjhunwala: [
    "What is the India growth story and why do you believe in it?",
    "How do you pick stocks in a market as volatile as the BSE?",
    "Which Indian sectors do you think will lead the next decade?",
  ],
  damani: [
    "What makes a retail business genuinely great in India?",
    "How do you think about unit economics when evaluating a company?",
    "Why is avoiding debt so important for long-term compounding?",
  ],
};

const VALID_KEYS = new Set([
  "buffett", "lynch", "graham", "munger", "dalio",
  "fisher", "templeton", "marks", "greenblatt", "klarman",
  "pabrai", "cundill", "terrysmith", "jhunjhunwala", "damani",
]);

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "12px 16px",
          borderRadius: "12px",
          fontSize: "14px",
          lineHeight: 1.7,
          background: isUser ? "var(--accent)" : "var(--surface)",
          color: isUser ? "var(--accent-foreground)" : "var(--text-primary)",
          border: isUser ? "none" : "1px solid var(--border)",
          whiteSpace: isUser ? "pre-wrap" : "normal",
        }}
      >
        {isUser ? (
          msg.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => <p style={{ margin: "0 0 10px 0" }} {...props} />,
              ul: ({ node, ...props }) => <ul style={{ margin: "0 0 10px 0", paddingLeft: "20px" }} {...props} />,
              li: ({ node, ...props }) => <li style={{ margin: "4px 0" }} {...props} />,
              table: ({ node, ...props }) => (
                <div style={{ overflowX: "auto", margin: "12px 0" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", border: "1px solid var(--border)" }} {...props} />
                </div>
              ),
              th: ({ node, ...props }) => <th style={{ border: "1px solid var(--border)", padding: "8px", background: "rgba(0,0,0,0.2)", textAlign: "left" }} {...props} />,
              td: ({ node, ...props }) => <td style={{ border: "1px solid var(--border)", padding: "8px" }} {...props} />,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          gap: "5px",
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--text-secondary)",
              display: "inline-block",
              animation: `dot-bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const investor = (params?.investor as string) ?? "";
  const stockSymbol = searchParams?.get("stock") ?? "";
  // ctx param carries the full rich context string built on the stock detail page
  const stockCtxParam = searchParams?.get("ctx") ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!VALID_KEYS.has(investor)) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", background: "var(--bg)", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>
          Unknown investor
        </h1>
        <Link href="/investors" style={{ color: "var(--accent)" }}>
          Choose a valid investor
        </Link>
      </div>
    );
  }

  const investorName = INVESTOR_NAMES[investor];
  const starters = STARTER_QUESTIONS[investor] ?? [];

  // Build stock_context - prefer full ctx param, fall back to just the symbol
  const stockContext = stockCtxParam
    ? stockCtxParam
    : stockSymbol
      ? `The user is asking about stock: ${stockSymbol}. Please reference this stock's fundamentals in your answer if relevant.`
      : "";

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await postChat(investor as InvestorKey, updated, stockContext);
      setMessages([...updated, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      <style>{`
        @keyframes dot-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
          overflow: "hidden", // strictly no page scrolling
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <Link
            href={`/screener/${investor}`}
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              padding: "4px",
            }}
            aria-label="Back to screener"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </Link>

          <InvestorAvatar investorKey={investor} size={40} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: "15px", lineHeight: 1.2, color: "var(--text-primary)" }}>
              {investorName}
            </p>
            {stockSymbol && (
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                discussing {stockSymbol.replace(".NS", "")}
              </p>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            maxWidth: "720px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {/* Welcome screen */}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <InvestorAvatar investorKey={investor} size={72} />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 600, marginTop: "4px", marginBottom: "6px" }}>
                Chat with {investorName}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "28px" }}>
                Ask anything about investing, stocks, or strategy.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  justifyContent: "center",
                  maxWidth: "520px",
                  margin: "0 auto",
                }}
              >
                {starters.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    style={{
                      padding: "8px 14px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "13px",
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      textAlign: "left",
                      lineHeight: 1.4,
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {loading && <ThinkingIndicator />}

          {error && (
            <div
              style={{
                margin: "8px 0 12px",
                padding: "10px 14px",
                background: "rgba(199, 122, 110, 0.1)",
                border: "1px solid var(--negative)",
                borderRadius: "var(--radius)",
                fontSize: "13px",
                color: "var(--negative)",
              }}
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div
          style={{
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
            padding: "12px 20px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${investorName} anything…`}
              rows={1}
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: "14px",
                resize: "none",
                background: "var(--bg)",
                color: "var(--text-primary)",
                maxHeight: "120px",
                overflow: "auto",
                lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            />
            <button
              id="chat-send-button"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              style={{
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: loading || !input.trim() ? "var(--border)" : "var(--accent)",
                color: "var(--accent-foreground)",
                border: "none",
                borderRadius: "var(--radius)",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                flexShrink: 0,
              }}
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              textAlign: "center",
              marginTop: "6px",
            }}
          >
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
