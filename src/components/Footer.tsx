import { Github } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-1.5 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-2">
        <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-[11px] flex items-center gap-2 flex-wrap">
          <span className="font-medium hidden sm:inline">© {new Date().getFullYear()} World Cup 2026 Simulator</span>
          <span className="sm:hidden font-medium">© 2026 Simulator</span>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-2">
            <Link href="/condiciones" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Condiciones
            </Link>
            <span className="opacity-30">|</span>
            <Link href="/privacidad" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacidad
            </Link>
          </div>
          <span className="opacity-30 hidden md:inline">|</span>
          <span className="hidden md:inline">
            Por <a className="underline hover:text-slate-900 dark:hover:text-white" href="https://github.com/josemqu">josemqu</a>
          </span>
        </div>

        <a
          href="https://github.com/josemqu/fifa-world-cup-2026"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group text-[10px] md:text-[11px]"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="font-medium hidden xs:inline">GitHub</span>
        </a>
      </div>
    </footer>
  );
}
