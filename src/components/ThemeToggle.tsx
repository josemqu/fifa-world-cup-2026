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
      <div className="w-[88px] h-10 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-full" />
    );
  }

  const currentIcon = theme === "system" ? <Monitor className="w-4 h-4" /> : theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  const currentLabel = theme === "system" ? "Sistema" : theme === "dark" ? "Oscuro" : "Claro";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-label="Toggle theme"
      >
        <div className="text-blue-600 dark:text-blue-400">
          {currentIcon}
        </div>
        <span className="hidden sm:block text-xs font-medium text-slate-700 dark:text-slate-300 w-12 text-left">
          {currentLabel}
        </span>
        <ChevronDown
          className={clsx(
            "w-3 h-3 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
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
