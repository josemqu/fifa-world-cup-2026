"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LogOut, User as UserIcon, Settings, ChevronDown, Home, Calendar, Trophy, GitFork, Sparkles, ShieldAlert, Target, MessageSquare, Menu, X, Github, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NextMatchCountdown } from "@/components/NextMatchCountdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user, dbUser, loginWithGoogle, logout, loading, setProfileModalOpen } =
    useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const isHome = pathname === "/";
  const isSchedule = pathname === "/schedule";
  const isFixture = pathname === "/fixture";
  const isPredictions = pathname === "/predictions";
  const isProde = pathname === "/prode";
  const isFeedback = pathname === "/feedback";

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
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-100 px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold rounded-lg shadow-lg ring-2 ring-blue-500"
        >
          Saltar al contenido
        </a>
        <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 py-3.5 md:py-6 flex items-center justify-between gap-4">
          {/* Title Section */}
          <div className="shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 md:gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="relative w-9 h-11 md:w-12 md:h-14">
                <Image
                  src="https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill,height:210&quality=75"
                  alt="World Cup 2026 Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Mundial{" "}
                  <span className="text-blue-600 dark:text-blue-400">2026</span>
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Fixture y Simulador
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Tabs + Countdown Section */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-3">
            <nav className="flex p-1 gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-sm shadow-inner border border-slate-200/50 dark:border-slate-700/50">
              <Link
                href="/"
                className={clsx(
                  "relative px-5 rounded-lg py-2 text-xs font-bold leading-5 text-center focus:outline-none transition-all duration-200 whitespace-nowrap",
                  isHome
                    ? "text-blue-600 dark:text-blue-100"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/20 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {isHome && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Inicio</span>
              </Link>
              <Link
                href="/schedule"
                className={clsx(
                  "relative px-5 rounded-lg py-2 text-xs font-bold leading-5 text-center focus:outline-none transition-all duration-200 whitespace-nowrap",
                  isSchedule
                    ? "text-blue-600 dark:text-blue-100"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/20 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {isSchedule && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Cronograma</span>
              </Link>
              <Link
                href="/fixture"
                className={clsx(
                  "relative px-5 rounded-lg py-2 text-xs font-bold leading-5 text-center focus:outline-none transition-all duration-200 whitespace-nowrap",
                  isFixture
                    ? "text-blue-600 dark:text-blue-100"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/20 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {isFixture && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Fixture</span>
              </Link>

              <Link
                href="/predictions"
                className={clsx(
                  "relative px-5 rounded-lg py-2 text-xs font-bold leading-5 text-center focus:outline-none transition-all duration-200 whitespace-nowrap",
                  isPredictions
                    ? "text-blue-600 dark:text-blue-100"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/20 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {isPredictions && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Predicciones</span>
              </Link>
              <Link
                href="/prode"
                className={clsx(
                  "relative px-5 rounded-lg py-2 text-xs font-bold leading-5 text-center focus:outline-none transition-all duration-200 whitespace-nowrap",
                  isProde
                    ? "text-blue-600 dark:text-blue-100"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/20 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {isProde && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">Prode</span>
              </Link>
            </nav>
            <Suspense fallback={<div className="w-32 h-8 bg-blue-50/40 dark:bg-blue-950/20 rounded-lg animate-pulse" />}>
              <NextMatchCountdown />
            </Suspense>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-2">
            {!user && <ThemeToggle />}
            {loading && !user ? (
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
                      className="relative flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {/* Pulsing indicator dot */}
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                      </span>
                      {user.photoURL ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative ring-1 ring-slate-200 dark:ring-slate-700">
                          <Image
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            fill
                            sizes="32px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center ring-1 ring-blue-200 dark:ring-blue-800">
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
                          {(dbUser?.role === "admin" || (user?.email?.toLowerCase().includes("mailjmq") || dbUser?.email?.toLowerCase().includes("mailjmq"))) && (
                            <>
                              {dbUser?.role === "admin" && (
                                <Link
                                  href="/admin"
                                  onClick={() => setIsDropdownOpen(false)}
                                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:bg-slate-100/80 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                                  Panel de Admin
                                </Link>
                              )}
                              {(dbUser?.role === "admin" || user?.email?.toLowerCase().includes("mailjmq") || dbUser?.email?.toLowerCase().includes("mailjmq")) && (
                                <button
                                  onClick={() => {
                                    setIsDropdownOpen(false);
                                    window.dispatchEvent(new Event("open-live-simulation"));
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:bg-slate-100/80 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                                  Simulación en Vivo
                                </button>
                              )}
                              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                            </>
                          )}
                          <button
                            onClick={handleEditProfile}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Editar Perfil
                          </button>
                          <Link
                            href="/feedback"
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between gap-2 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              <span>Feedback</span>
                            </div>
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                          </Link>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                          
                          {mounted && (
                            <div className="px-3 py-2">
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Tema de la interfaz</span>
                              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 gap-1">
                                <button onClick={() => setTheme("light")} className={clsx("flex-1 flex justify-center py-1.5 rounded-md transition-colors", theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')} title="Claro">
                                  <Sun className="w-4 h-4" />
                                </button>
                                <button onClick={() => setTheme("dark")} className={clsx("flex-1 flex justify-center py-1.5 rounded-md transition-colors", theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')} title="Oscuro">
                                  <Moon className="w-4 h-4" />
                                </button>
                                <button onClick={() => setTheme("system")} className={clsx("flex-1 flex justify-center py-1.5 rounded-md transition-colors", theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')} title="Sistema">
                                  <Monitor className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

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
            
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Abrir menú"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/60 shadow-lg px-2 py-2 flex justify-around items-center pb-safe-bottom">
        <Link
          href="/"
          className={clsx(
            "flex flex-col items-center gap-1 py-1 px-2 text-center transition-colors rounded-lg",
            isHome
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Inicio</span>
        </Link>
        <Link
          href="/schedule"
          className={clsx(
            "flex flex-col items-center gap-1 py-1 px-2 text-center transition-colors rounded-lg",
            isSchedule
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Cronograma</span>
        </Link>
        <Link
          href="/fixture"
          className={clsx(
            "flex flex-col items-center gap-1 py-1 px-2 text-center transition-colors rounded-lg",
            isFixture
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Fixture</span>
        </Link>

        <Link
          href="/predictions"
          className={clsx(
            "flex flex-col items-center gap-1 py-1 px-2 text-center transition-colors rounded-lg",
            isPredictions
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Predicción</span>
        </Link>
        <Link
          href="/prode"
          className={clsx(
            "flex flex-col items-center gap-1 py-1 px-2 text-center transition-colors rounded-lg",
            isProde
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Prode</span>
        </Link>
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-72 max-w-[85vw] z-[100] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:hidden font-sans"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-8">
                    <Image
                      src="https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill,height:210&quality=75"
                      alt="World Cup 2026 Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Mundial <span className="text-blue-600 dark:text-blue-400">2026</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Fixture y Simulador
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                {/* Main Navigation links */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Navegación
                  </span>
                  <nav className="flex flex-col gap-1">
                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isHome
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <Home className="w-4.5 h-4.5" />
                      <span>Inicio</span>
                    </Link>
                    <Link
                      href="/schedule"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isSchedule
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <Calendar className="w-4.5 h-4.5" />
                      <span>Cronograma</span>
                    </Link>
                    <Link
                      href="/fixture"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isFixture
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <Trophy className="w-4.5 h-4.5" />
                      <span>Fixture</span>
                    </Link>
                    <Link
                      href="/predictions"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isPredictions
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <Sparkles className="w-4.5 h-4.5" />
                      <span>Predicciones</span>
                    </Link>
                    <Link
                      href="/prode"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isProde
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <Target className="w-4.5 h-4.5" />
                      <span>Prode</span>
                    </Link>
                  </nav>
                </div>

                {/* Footer Content */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Información y Enlaces
                  </span>
                  <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <Link
                      href="/condiciones"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 flex items-center gap-2"
                    >
                      <span>Términos y Condiciones</span>
                    </Link>
                    <Link
                      href="/privacidad"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 flex items-center gap-2"
                    >
                      <span>Política de Privacidad</span>
                    </Link>
                    <Link
                      href="/feedback"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 flex items-center gap-2"
                    >
                      <span>Feedback</span>
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                      </span>
                    </Link>
                    <a
                      href="https://github.com/josemqu/fifa-world-cup-2026"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 flex items-center gap-2"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  </div>

                  {/* Copyright and Credits */}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal pt-2">
                    <p>© 2026 Mundial de Selecciones</p>
                    <p className="mt-1">
                      Desarrollado por{" "}
                      <a
                        href="https://github.com/josemqu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-slate-600 dark:hover:text-slate-400 text-slate-500 dark:text-slate-400"
                      >
                        josemqu
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
