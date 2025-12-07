"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useTournament } from "@/context/TournamentContext";

export function Header() {
  const pathname = usePathname();
  const { simulateAll, simulateKnockout } = useTournament();

  const isGroups = pathname === "/groups" || pathname === "/";
  const isKnockout = pathname === "/knockout";

  return (
    <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title Section */}
        <div className="shrink-0 text-center md:text-left">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            FIFA World Cup{" "}
            <span className="text-blue-600 dark:text-blue-400">2026</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Fixture Oficial & Simulador
          </p>
        </div>

        {/* Tabs Section */}
        <div className="flex p-1 gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl w-full md:w-auto backdrop-blur-sm">
          <Link
            href="/groups"
            className={clsx(
              "w-full md:w-40 rounded-lg py-2 text-sm font-bold leading-5 text-center ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200",
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
              "w-full md:w-40 rounded-lg py-2 text-sm font-bold leading-5 text-center ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200",
              isKnockout
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-white/40 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Fase Eliminatoria
          </Link>
        </div>

        {/* Actions Section */}
        <div className="shrink-0">
          <button
            onClick={simulateAll}
            className="bg-blue-600/90 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95 transform backdrop-blur-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.312-.312a7 7 0 00-11.712 3.139.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.312h-2.433a.75.75 0 000 1.5h4.242z"
                clipRule="evenodd"
              />
            </svg>
            Simular Todo
          </button>
        </div>
      </div>
    </div>
  );
}
