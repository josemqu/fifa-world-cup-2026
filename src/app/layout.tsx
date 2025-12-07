import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="es">
      <body
        className={`${inter.className} bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100`}
      >
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              FIFA World Cup{" "}
              <span className="text-blue-600 dark:text-blue-400">2026</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Fixture oficial y simulador de la fase eliminatoria
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
