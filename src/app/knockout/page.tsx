"use client";

import { useState, useMemo } from "react";
import { KnockoutStage } from "@/components/KnockoutStage";
import { useTournament } from "@/context/TournamentContext";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Info, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SimulationOverlay } from "@/components/ui/SimulationOverlay";

export default function KnockoutPage() {
  const { user, loading } = useAuth();
  const {
    groups,
    knockoutMatches,
    predictions,
    setSimulationResults,
    clearSimulationResults,
    isSimulationStale,
    updateKnockoutMatch,
  } = useTournament();

  const canRunSimulation = !!user && !loading;

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);

  const teamNames = useMemo(() => {
    return groups.flatMap((g) => g.teams).map((t) => t.name);
  }, [groups]);

  const handleRun = async (numIterations: number = 10000) => {
    setIsRunning(true);
    setProgress(0);
    setCurrentIteration(0);
    clearSimulationResults();

    // Small delay to allow the overlay spinner to render and animate in
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Instantiate background Web Worker
    const worker = new Worker(
      new URL("../../workers/simulation.worker.ts", import.meta.url)
    );

    worker.postMessage({
      type: "predictions",
      groups,
      knockoutMatches,
      iterations: numIterations,
    });

    worker.onmessage = (e) => {
      const { status, progress, currentIteration, elapsedMs, error } = e.data;

      if (status === "progress") {
        setProgress(progress);
        setCurrentIteration(currentIteration);
      } else if (status === "success") {
        setSimulationResults(
          e.data.predictions,
          e.data.matchups,
          e.data.knockoutProbabilities,
          numIterations,
          elapsedMs
        );
        setIsRunning(false);
        worker.terminate();
      } else if (status === "error") {
        console.error("Simulation worker error:", error);
        setIsRunning(false);
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      console.error("Worker error event:", err);
      setIsRunning(false);
      worker.terminate();
    };
  };

  return (
    <PageTransition className="max-w-[1600px] mx-auto p-4 md:p-4">
      {/* ─── Simulation Status Banners ─── */}
      <AnimatePresence>
        {isSimulationStale && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start sm:items-center gap-3 text-amber-800 dark:text-amber-300 shadow-xs mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold">Simulación desactualizada</h4>
                  <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                    Los resultados de los partidos cambiaron. Te recomendamos volver a ejecutar la simulación de Montecarlo (10.000 iteraciones) para actualizar las probabilidades del bracket.
                  </p>
                </div>
                {canRunSimulation ? (
                  <button
                    onClick={() => handleRun()}
                    disabled={isRunning}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Simular ahora
                  </button>
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                    Inicia sesión para simular
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!isSimulationStale && predictions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex items-start sm:items-center gap-3 text-blue-800 dark:text-blue-300 shadow-xs mb-4">
              <Info className="w-5 h-5 shrink-0 text-blue-500" />
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold">Simulación de alta precisión no iniciada</h4>
                  <p className="text-xs text-blue-700/90 dark:text-blue-400/90 mt-0.5">
                    Se muestran probabilidades rápidas estimadas (200 corridas). Ejecuta la simulación de Montecarlo (10.000 corridas) para obtener probabilidades altamente precisas y consistentes con la sección de Predicciones y Cruces.
                  </p>
                </div>
                {canRunSimulation ? (
                  <button
                    onClick={() => handleRun()}
                    disabled={isRunning}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Simular ahora
                  </button>
                ) : (
                  <span className="text-xs text-blue-600 dark:text-blue-400 italic">
                    Inicia sesión para simular
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <KnockoutStage
        groups={groups}
        matches={knockoutMatches}
        onMatchUpdate={updateKnockoutMatch}
      />

      <SimulationOverlay
        isOpen={isRunning}
        progress={progress}
        currentIteration={currentIteration}
        totalIterations={10000}
        teamNames={teamNames}
        type="predictions"
      />
    </PageTransition>
  );
}
