"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { useLiveScores, GoalNotificationInfo } from "@/hooks/useLiveScores";

/**
 * Component that activates live score polling and shows
 * animated toast notifications in the bottom-left when a goal is scored.
 */
export function LiveScoreSync() {
  const [toasts, setToasts] = useState<GoalNotificationInfo[]>([]);

  const handleGoalScored = useCallback((info: GoalNotificationInfo) => {
    setToasts((prev) => [...prev, info]);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== info.id));
    }, 6000);
  }, []);

  // Run the polling hook with our goal notification handler
  useLiveScores(true, handleGoalScored);

  return (
    <div className="fixed bottom-5 left-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto w-full bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-800/80 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative backdrop-blur-md"
          >
            {/* Top accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

            <div className="relative p-4 flex flex-col gap-3">
              {/* Close Button */}
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full hover:bg-slate-800"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  ¡GOL EN VIVO!
                </span>
                {toast.minute && (
                  <span className="text-[11px] text-slate-400 font-medium ml-auto pr-6">
                    Minuto {toast.minute}
                  </span>
                )}
              </div>

              {/* Teams and Score */}
              <div className="flex items-center justify-between gap-4 py-1">
                {/* Home Team */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <TeamFlag teamName={toast.homeTeamName} className="w-7 h-5 shrink-0 rounded" />
                  <span
                    className={`text-sm truncate ${
                      toast.scoringTeam === "home"
                        ? "text-emerald-400 font-black"
                        : "text-slate-100 font-medium"
                    }`}
                  >
                    {toast.homeTeamName}
                  </span>
                </div>

                {/* Score Badge */}
                <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-xl font-mono text-base font-extrabold tracking-widest text-center shadow-inner shrink-0 select-none">
                  <span className={toast.scoringTeam === "home" ? "text-emerald-400" : "text-white"}>
                    {toast.newScore.home}
                  </span>
                  <span className="text-slate-500 mx-1">-</span>
                  <span className={toast.scoringTeam === "away" ? "text-emerald-400" : "text-white"}>
                    {toast.newScore.away}
                  </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                  <span
                    className={`text-sm truncate ${
                      toast.scoringTeam === "away"
                        ? "text-emerald-400 font-black"
                        : "text-slate-100 font-medium"
                    }`}
                  >
                    {toast.awayTeamName}
                  </span>
                  <TeamFlag teamName={toast.awayTeamName} className="w-7 h-5 shrink-0 rounded" />
                </div>
              </div>

              {/* Scorer Info */}
              {toast.scorerName && (
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-800/50">
                  <span className="text-emerald-400 animate-bounce">⚽</span>
                  <span className="font-semibold">{toast.scorerName}</span>
                  {toast.isPenalty && (
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-bold uppercase">
                      Penal
                    </span>
                  )}
                  {toast.isOwnGoal && (
                    <span className="text-[9px] bg-red-900/40 text-red-300 px-1 py-0.5 rounded font-bold uppercase border border-red-800/50">
                      Autogol
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
