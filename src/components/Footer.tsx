import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-slate-500 dark:text-slate-400 text-xs text-center md:text-left">
          <p>© {new Date().getFullYear()} FIFA World Cup 2026 Simulator.</p>
          <p className="mt-0.5 opacity-75">
            Hecho con ❤️ por{" "}
            <a className="underline" href="https://github.com/josemqu">
              josemqu
            </a>
          </p>
        </div>

        <a
          href="https://github.com/josemqu/fifa-world-cup-2026"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
            <Github className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Ver código en GitHub</span>
        </a>
      </div>
    </footer>
  );
}
