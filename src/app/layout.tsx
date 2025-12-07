import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/context/TournamentContext";
import { Header } from "@/components/Header";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 Fixture",
  description: "Fixture interactivo para el Mundial 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100`}
      >
        <TournamentProvider>
          <Header />
          <main className="min-h-screen pb-12">{children}</main>
        </TournamentProvider>
        <Analytics />
      </body>
    </html>
  );
}
