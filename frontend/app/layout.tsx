import type { Metadata } from "next";
import "./globals.css";
import GlobalFooter from "@/components/GlobalFooter";
import AuthGuard from "@/components/AuthGuard";
import ToastProvider from "@/components/ToastProvider";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Investor AI - Nifty 50 Advisory",
  description:
    "AI-powered investment advisory for Indian equities. Screen Nifty 50 stocks by fundamentals and get AI-driven insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <ToastProvider>
          <AuthGuard>
            <NavBar />
            <main className="flex-1">{children}</main>
            <GlobalFooter />
          </AuthGuard>
        </ToastProvider>
      </body>
    </html>
  );
}
