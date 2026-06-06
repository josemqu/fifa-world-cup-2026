"use client";

import { useEffect, useState, useMemo } from "react";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Swords, TrendingUp } from "lucide-react";

interface SimulationOverlayProps {
  isOpen: boolean;
  progress: number;
  currentIteration: number;
  totalIterations: number;
  teamNames: string[];
  type?: "matchups" | "predictions";
}

const RUNNING_PHRASES = [
  "Simulando fase de grupos...",
  "Calculando clasificados a 16avos...",
  "Cruzando rivales en octavos...",
  "Simulando llaves de cuartos...",
  "Disputando semifinales de alta tensión...",
  "Definiendo la gran final del mundo...",
  "Calculando probabilidades de Montecarlo...",
  "Corriendo simulaciones de penales...",
  "Compilando estadísticas de rendimiento...",
  "Analizando posibles campeones...",
];

export function SimulationOverlay({
  isOpen,
  progress,
  currentIteration,
  totalIterations,
  teamNames,
  type = "predictions",
}: SimulationOverlayProps) {
  interface StackedFlag {
    id: string;
    teamName: string;
    rotate: number;
    x: number;
    y: number;
  }

  const [stackedFlags, setStackedFlags] = useState<StackedFlag[]>([]);
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycle flags at a slower, visible pace and stack them while running
  useEffect(() => {
    if (!isOpen || teamNames.length === 0) {
      setStackedFlags([]);
      return;
    }

    // Set first flag
    const firstTeam = teamNames[Math.floor(Math.random() * teamNames.length)];
    setStackedFlags([
      {
        id: Math.random().toString(),
        teamName: firstTeam,
        rotate: (Math.random() - 0.5) * 20, // -10deg to 10deg
        x: (Math.random() - 0.5) * 12, // -6px to 6px
        y: (Math.random() - 0.5) * 12, // -6px to 6px
      },
    ]);

    const interval = setInterval(() => {
      const randomTeam = teamNames[Math.floor(Math.random() * teamNames.length)];
      setStackedFlags((prev) => {
        const next = [
          ...prev,
          {
            id: Math.random().toString(),
            teamName: randomTeam,
            rotate: (Math.random() - 0.5) * 30, // -15deg to 15deg
            x: (Math.random() - 0.5) * 16, // -8px to 8px
            y: (Math.random() - 0.5) * 16, // -8px to 8px
          },
        ];
        // Keep the last 5 stacked flags to show the pile but prevent performance issues
        if (next.length > 5) {
          return next.slice(next.length - 5);
        }
        return next;
      });
    }, 400); // 400ms per flag (2.5 flags per second)

    return () => clearInterval(interval);
  }, [isOpen, teamNames]);

  // Cycle phrases every 2000ms (2 seconds) to make them comfortable to read
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % RUNNING_PHRASES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Dynamic colors based on page theme
  const isMatchups = type === "matchups";
  const gradientClass = isMatchups
    ? "from-violet-500 to-fuchsia-500"
    : "from-blue-500 to-indigo-500";
  const ringGradient = isMatchups
    ? "conic-gradient(from 0deg, var(--color-violet-500), var(--color-fuchsia-500), var(--color-violet-500))"
    : "conic-gradient(from 0deg, var(--color-blue-500), var(--color-indigo-500), var(--color-blue-500))";
  
  const accentColorClass = isMatchups
    ? "text-violet-600 dark:text-violet-400"
    : "text-blue-600 dark:text-blue-400";
  
  const glowShadow = isMatchups
    ? "shadow-[0_0_40px_rgba(168,85,247,0.3)]"
    : "shadow-[0_0_40px_rgba(59,130,246,0.3)]";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden ${glowShadow}`}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-12 -left-12 w-24 h-24 rounded-full bg-gradient-to-br ${gradientClass} opacity-10 blur-2xl pointer-events-none`} />
            <div className={`absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br ${gradientClass} opacity-10 blur-2xl pointer-events-none`} />

            {/* Spinner Header */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Rotating Outer Ring (Conic gradient) */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-0 rounded-full p-[3px] mask-gradient"
                  style={{
                    background: `linear-gradient(to right, ${isMatchups ? '#8b5cf6, #d946ef' : '#3b82f6, #6366f1'})`
                  }}
                >
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full" />
                </motion.div>

                {/* Inner Circle with Stacked Flags in Pile */}
                <div className="absolute inset-2 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center shadow-inner overflow-hidden border border-slate-100 dark:border-slate-800/80">
                  <div className="relative w-20 h-14 flex items-center justify-center">
                    <AnimatePresence>
                      {stackedFlags.map((flag, index) => (
                        <motion.div
                          key={flag.id}
                          initial={{ 
                            scale: 1.6, 
                            opacity: 0, 
                            rotate: flag.rotate - 35,
                            x: flag.x,
                            y: flag.y - 35 
                          }}
                          animate={{ 
                            scale: 1, 
                            opacity: 1, 
                            rotate: flag.rotate,
                            x: flag.x,
                            y: flag.y 
                          }}
                          exit={{ 
                            scale: 0.75, 
                            opacity: 0, 
                            y: 20,
                            rotate: flag.rotate + 15
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 140, 
                            damping: 14 
                          }}
                          className="absolute w-14 h-10 shadow-lg"
                          style={{ zIndex: index }}
                        >
                          <TeamFlag
                            teamName={flag.teamName}
                            className="w-full h-full rounded shadow-md object-cover border border-slate-200 dark:border-slate-700"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Phrases */}
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                {isMatchups ? (
                  <Swords className={`w-5 h-5 ${accentColorClass} animate-pulse`} />
                ) : (
                  <TrendingUp className={`w-5 h-5 ${accentColorClass} animate-pulse`} />
                )}
                Simulación en Curso
              </h3>
              <div className="h-6 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phraseIndex}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-semibold text-slate-500 dark:text-slate-400"
                  >
                    {RUNNING_PHRASES[phraseIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                <span>
                  {currentIteration.toLocaleString("es-ES")} /{" "}
                  {totalIterations.toLocaleString("es-ES")}
                </span>
                <span className={accentColorClass}>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px] border border-slate-200/50 dark:border-slate-700/50">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Timer Indicator */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              <span>Calculando probabilidades...</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
