"use client";

import * as React from "react";
import { Moon, Sun, Monitor, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { clsx } from "clsx";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg" />
    );
  }

  const currentIcon = theme === "system" ? <Monitor className="w-5 h-5" /> : theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
  const currentLabel = theme === "system" ? "Sistema" : theme === "dark" ? "Oscuro" : "Claro";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-9 h-9 flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer",
          isOpen
            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
        )}
        aria-label={`Tema: ${currentLabel}`}
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="p-1 flex flex-col gap-0.5">
            <button
              onClick={() => { setTheme("light"); setIsOpen(false); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors",
                theme === "light" 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium" 
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <Sun className="w-4 h-4" />
              Claro
            </button>
            <button
              onClick={() => { setTheme("dark"); setIsOpen(false); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors",
                theme === "dark" 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium" 
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <Moon className="w-4 h-4" />
              Oscuro
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-0.5 mx-2" />
            <button
              onClick={() => { setTheme("system"); setIsOpen(false); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors",
                theme === "system" 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium" 
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <Monitor className="w-4 h-4" />
              Sistema
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
