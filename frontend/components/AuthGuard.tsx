"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Paths that are visible without a session
const PUBLIC_PATHS = ["/", "/login", "/signup", "/investors"];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        if (!isPublic(pathname)) {
          // Redirect to login, preserving the intended destination
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          // Keep loading=true so we don't flash the protected page while redirecting
        } else {
          setLoading(false);
        }
      } else {
        // Logged-in user hitting login/signup — bounce them to investors
        if (pathname === "/login" || pathname === "/signup") {
          router.replace("/investors");
          // Keep loading=true — redirect is in flight
        } else {
          setLoading(false);
        }
      }
    };

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublic(pathname)) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (session && (pathname === "/login" || pathname === "/signup")) {
        router.replace("/investors");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text-secondary)",
          fontSize: "14px",
          gap: "10px",
        }}
      >
        {/* Minimal spinner */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ animation: "spin 0.8s linear infinite" }}
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
