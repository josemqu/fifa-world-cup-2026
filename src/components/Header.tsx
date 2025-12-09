"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function Header() {
  const pathname = usePathname();

  const isGroups = pathname === "/groups" || pathname === "/";
  const isKnockout = pathname === "/knockout";
  const isPredictions = pathname === "/predictions";

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-100 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold rounded-lg shadow-lg ring-2 ring-blue-500"
      >
        Saltar al contenido
      </a>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title Section */}
        <div className="shrink-0 text-center md:text-left">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-12 md:w-12 md:h-14">
              <Image
                src="https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill,height:210&quality=75"
                alt="FIFA World Cup 2026 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                FIFA World Cup{" "}
                <span className="text-blue-600 dark:text-blue-400">2026</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Fixture & Simulador
              </p>
            </div>
          </Link>
        </div>

        {/* Tabs Section */}
        <nav className="flex p-1 gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl w-full md:w-auto backdrop-blur-sm">
          <Link
            href="/groups"
            className={clsx(
              "w-full md:w-32 lg:w-40 rounded-lg py-2 text-sm font-bold leading-5 text-center ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200",
              isGroups
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-white/40 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Fase de Grupos
          </Link>
          <Link
            href="/knockout"
            className={clsx(
              "w-full md:w-32 lg:w-40 rounded-lg py-2 text-sm font-bold leading-5 text-center ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200",
              isKnockout
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-white/40 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Fase Eliminatoria
          </Link>
          <Link
            href="/predictions"
            className={clsx(
              "w-full md:w-32 lg:w-40 rounded-lg py-2 text-sm font-bold leading-5 text-center ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200",
              isPredictions
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-white/40 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Predicciones
          </Link>
        </nav>
      </div>
    </header>
  );
}
