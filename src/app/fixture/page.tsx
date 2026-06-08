"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTournament } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { GroupStage } from "@/components/GroupStage";
import { KnockoutStage } from "@/components/KnockoutStage";
import { SimulationOverlay } from "@/components/ui/SimulationOverlay";
import { Trophy, GitFork, AlertTriangle, Info, Swords, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

function FixturePageContent() {
  const { user, loading } = useAuth();
  const {
    groups,
    knockoutMatches,
    predictions,
    setSimulationResults,
    clearSimulationResults,
    isSimulationStale,
    updateMatch,
    updateKnockoutMatch,
  } = useTournament();

  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State syncing with search params: "groups" or "knockout"
  const activeTab = (searchParams.get("tab") as "groups" | "knockout") || "groups";

  const setActiveTab = (tab: "groups" | "knockout") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/fixture?${params.toString()}`, { scroll: false });
  };

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Fixture del Mundial 2026
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
              Explorá la fase de grupos y simulá los cruces de la fase eliminatoria rumbo a la gran final.
            </p>
          </div>
        </div>

        {/* Sub-tab Selector */}
        <div className="flex p-1 gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-sm shadow-inner border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-max">
          <button
            onClick={() => setActiveTab("groups")}
            className={clsx(
              "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "groups"
                ? "text-blue-600 dark:text-blue-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "groups" && (
              <motion.div
                layoutId="fixtureSubTab"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" />
              Fase de Grupos
            </span>
          </button>

          <button
            onClick={() => setActiveTab("knockout")}
            className={clsx(
              "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "knockout"
                ? "text-blue-600 dark:text-blue-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "knockout" && (
              <motion.div
                layoutId="fixtureSubTab"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <GitFork className="w-3.5 h-3.5" />
              Llaves
            </span>
          </button>
        </div>

        {/* Sub-tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "groups" ? (
            <motion.div
              key="groups-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GroupStage groups={groups} onMatchUpdate={updateMatch} />
            </motion.div>
          ) : (
            <motion.div
              key="knockout-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Simulation Status Banners */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default function FixturePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <FixturePageContent />
    </Suspense>
  );
}
