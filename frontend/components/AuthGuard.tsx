"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const isPublicPath = 
        pathname === "/" || 
        pathname === "/login" || 
        pathname === "/signup" || 
        pathname === "/investors";

      if (!session) {
        if (!isPublicPath) {
          router.replace("/login");
        } else {
          setLoading(false);
        }
      } else {
        if (pathname === "/login" || pathname === "/signup") {
          router.replace("/investors");
        } else {
          setLoading(false);
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isPublicPath = 
        pathname === "/" || 
        pathname === "/login" || 
        pathname === "/signup" || 
        pathname === "/investors";
        
      if (!session) {
        if (!isPublicPath) {
          router.replace("/login");
        }
      } else {
        if (pathname === "/login" || pathname === "/signup") {
          router.replace("/investors");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Optionally show a blank screen or a loading spinner while determining auth state
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text-secondary)" }}>
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
