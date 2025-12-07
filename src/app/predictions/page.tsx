"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { runMonteCarloSimulation, PredictionResult } from "@/utils/monteCarlo";
import { clsx } from "clsx";

export default function PredictionsPage() {
  const { groups } = useTournament();
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [iterations, setIterations] = useState(1000);

  const handleRun = async () => {
    setIsRunning(true);
    setResults([]);
    // Add a small delay to allow UI to update to loading state
    setTimeout(async () => {
      const data = await runMonteCarloSimulation(groups, iterations);
      setResults(data);
      setIsRunning(false);
    }, 100);
  };

  const getPercentage = (count: number) => {
    return ((count / iterations) * 100).toFixed(1) + "%";
  };

  const getProbabilityColor = (percentage: number) => {
    if (percentage >= 50) return "text-green-600 dark:text-green-400 font-bold";
    if (percentage >= 25)
      return "text-blue-600 dark:text-blue-400 font-semibold";
    if (percentage >= 10) return "text-slate-900 dark:text-slate-100";
    return "text-slate-500 dark:text-slate-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Simulación de Montecarlo
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Simula el resto del torneo {iterations.toLocaleString()} veces
                para calcular las probabilidades de cada equipo.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                disabled={isRunning}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={100}>100 simulaciones</option>
                <option value={1000}>1,000 simulaciones</option>
                <option value={5000}>5,000 simulaciones</option>
                <option value={10000}>10,000 simulaciones</option>
              </select>

              <button
                onClick={handleRun}
                disabled={isRunning}
                className={clsx(
                  "px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md active:scale-95",
                  isRunning
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
                )}
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Simulando...
                  </span>
                ) : (
                  "Ejecutar Simulación"
                )}
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3 text-right">Campeón</th>
                    <th className="px-4 py-3 text-right">Final</th>
                    <th className="px-4 py-3 text-right">Semis</th>
                    <th className="px-4 py-3 text-right">Cuartos</th>
                    <th className="px-4 py-3 text-right">Octavos</th>
                    <th className="px-4 py-3 text-right">16avos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results
                    .filter((r) => r.r32Count > 0) // Only show teams that have a chance to qualify (or qualified)
                    .map((team, index) => {
                      const winRate = (team.championCount / iterations) * 100;

                      return (
                        <tr
                          key={team.teamId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm"
                        >
                          <td className="px-4 py-3 text-slate-400 dark:text-slate-600 font-mono">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            {team.teamName}
                          </td>
                          <td
                            className={clsx(
                              "px-4 py-3 text-right",
                              getProbabilityColor(winRate)
                            )}
                          >
                            {getPercentage(team.championCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {getPercentage(team.finalistCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {getPercentage(team.semiFinalistCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {getPercentage(team.quarterFinalistCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {getPercentage(team.r16Count)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {getPercentage(team.r32Count)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {results.length === 0 && !isRunning && (
            <div className="text-center py-20 text-slate-400 dark:text-slate-600">
              <p>Presiona "Ejecutar Simulación" para ver las probabilidades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
