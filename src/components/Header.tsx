"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const pathname = usePathname();
  const { user, loginWithGoogle, logout, loading } = useAuth();

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

        {/* User Section */}
        <div className="flex items-center gap-2">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="hidden lg:block text-xs font-medium">
                    <p className="text-slate-900 dark:text-slate-100 max-w-[100px] truncate">
                      {user.displayName?.split(" ")[0]}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Ingresar</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
