"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ToastProvider";

// Paths where the nav bar should NOT show (auth pages, etc.)
const HIDDEN_PATHS = ["/login", "/signup"];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide on auth pages
  if (HIDDEN_PATHS.includes(pathname)) return null;
  // Hide if not logged in or still loading
  if (!isLoggedIn) return null;

  async function handleLogout() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      showToast("You've been signed out. See you soon! 👋", "info", "👋");
      router.push("/");
    } catch {
      showToast("Sign out failed. Please try again.", "error");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Investors link if not already on that page */}
      {pathname !== "/investors" && (
        <Link
          href="/investors"
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            padding: "7px 14px",
            borderRadius: "var(--radius)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
          }}
        >
          Investors
        </Link>
      )}

      {/* Logout button */}
      <button
        onClick={handleLogout}
        disabled={signingOut}
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: signingOut ? "var(--text-secondary)" : "var(--accent)",
          background: "var(--surface)",
          border: "1px solid var(--accent)",
          borderRadius: "var(--radius)",
          padding: "7px 14px",
          cursor: signingOut ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "background 0.15s, color 0.15s",
          opacity: signingOut ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!signingOut) {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(217,119,87,0.12)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {signingOut ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}
