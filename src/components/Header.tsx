"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LogOut, User as UserIcon, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const pathname = usePathname();
  const {
    user,
    dbUser,
    loginWithGoogle,
    logout,
    loading,
    setProfileModalOpen,
  } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isGroups = pathname === "/groups" || pathname === "/";
  const isKnockout = pathname === "/knockout";
  const isPredictions = pathname === "/predictions";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditProfile = () => {
    setProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-100 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold rounded-lg shadow-lg ring-2 ring-blue-500"
      >
        Saltar al contenido
      </a>
      <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title Section */}
        <div className="shrink-0 text-center md:text-left">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-12 md:w-12 md:h-14">
              <Image
                src="https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill,height:210&quality=75"
                alt="World Cup 2026 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                World Cup{" "}
                <span className="text-blue-600 dark:text-blue-400">2026</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Fixture & Simulador
              </p>
            </div>
          </Link>
        </div>

        {/* Tabs Section */}
        <nav className="flex p-1 gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl w-full md:w-auto backdrop-blur-sm md:absolute md:left-1/2 md:-translate-x-1/2">
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
          {dbUser?.role === "admin" && (
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
          )}
        </nav>

        {/* User Section */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="hidden lg:block w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
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
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 max-w-[100px] truncate">
                        {user.displayName?.split(" ")[0]}
                      </p>
                    </div>
                    <ChevronDown
                      className={clsx(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        isDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                      <div className="p-1">
                        <button
                          onClick={handleEditProfile}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Editar Perfil
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
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
