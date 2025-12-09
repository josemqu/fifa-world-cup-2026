"use client";

import { useState, useMemo } from "react";
import { useTournament } from "@/context/TournamentContext";
import { runMonteCarloSimulation, PredictionResult } from "@/utils/monteCarlo";
import { simulateTournament } from "@/utils/simulationUtils";
import { Tooltip } from "@/components/ui/Tooltip";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { Info, Timer, CheckCircle2, X } from "lucide-react";
import { clsx } from "clsx";
import { Team, KnockoutMatch } from "@/data/types";

type SortColumn =
  | "teamName"
  | "teamRanking"
  | "teamFifaPoints"
  | "championCount"
  | "finalistCount"
  | "semiFinalistCount"
  | "quarterFinalistCount"
  | "r16Count"
  | "r32Count";

export default function PredictionsPage() {
  const { groups } = useTournament();
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [iterations, setIterations] = useState(10000);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>("championCount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Verification State
  const [showVerification, setShowVerification] = useState(false);
  const [sampleResult, setSampleResult] = useState<{
    champion?: Team;
    finalists: Team[];
    matches: KnockoutMatch[];
  } | null>(null);

  const handleRun = async (numIterations: number = iterations) => {
    setIsRunning(true);
    setResults([]);
    setExecutionTime(0);
    // Add a small delay to allow UI to update to loading state
    setTimeout(async () => {
      const start = performance.now();
      const data = await runMonteCarloSimulation(groups, numIterations);
      const end = performance.now();

      setExecutionTime(end - start);
      setResults(data);
      setIsRunning(false);
    }, 100);
  };

  const handleVerify = () => {
    const result = simulateTournament(groups);
    const final = result.knockoutMatches.find((m) => m.stage === "Final");
    const champion = final?.winner || undefined;
    const finalists = [final?.homeTeam, final?.awayTeam].filter(
      (t) => t && !("placeholder" in t)
    ) as Team[];

    setSampleResult({
      champion,
      finalists,
      matches: result.knockoutMatches,
    });
    setShowVerification(true);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      // Default to ascending for ranking (lower is better), descending for others
      setSortDirection(column === "teamRanking" ? "asc" : "desc");
    }
  };

  const sortedResults = useMemo(() => {
    return [...results]
      .filter((r) => r.r32Count > 0)
      .sort((a, b) => {
        let comparison = 0;

        // Primary sort
        if (sortColumn === "teamName") {
          comparison = a.teamName.localeCompare(b.teamName);
        } else if (sortColumn === "teamRanking") {
          // Handle undefined rankings (put them last)
          const rankA = a.teamRanking ?? 999;
          const rankB = b.teamRanking ?? 999;
          comparison = rankA - rankB;
        } else if (sortColumn === "teamFifaPoints") {
          const pointsA = a.teamFifaPoints ?? 0;
          const pointsB = b.teamFifaPoints ?? 0;
          comparison = pointsA - pointsB;
        } else {
          comparison = (a[sortColumn] as number) - (b[sortColumn] as number);
        }

        // Reverse if descending (default for numbers)
        // For text (teamName), asc means A-Z, so we keep comparison.
        // For numbers (like ranking), asc means 1-100 (smaller is better/first).
        // For stats (counts), asc means 0-100, desc means 100-0.

        // Handling Sort Direction Inversion
        if (sortColumn === "teamName") {
          if (sortDirection === "desc") {
            comparison = b.teamName.localeCompare(a.teamName);
          }
        } else if (sortColumn === "teamRanking") {
          // For Ranking: Asc (1 -> 100), Desc (100 -> 1).
          // Default comparison is Asc (a - b).
          if (sortDirection === "desc") {
            const rankA = a.teamRanking ?? 999;
            const rankB = b.teamRanking ?? 999;
            comparison = rankB - rankA;
          }
        } else if (sortColumn === "teamFifaPoints") {
          // For Points: Asc (0 -> 2000), Desc (2000 -> 0).
          // Default comparison is Asc (a - b).
          if (sortDirection === "desc") {
            const pointsA = a.teamFifaPoints ?? 0;
            const pointsB = b.teamFifaPoints ?? 0;
            comparison = pointsB - pointsA;
          }
        } else {
          // For Stats: Asc (0 -> 100), Desc (100 -> 0).
          // Default comparison is Asc (a - b).
          if (sortDirection === "desc") {
            comparison = (b[sortColumn] as number) - (a[sortColumn] as number);
          }
        }

        if (comparison !== 0) return comparison;

        // Tie-breakers (always cascading descending for stats)
        // Champion -> Final -> SF -> QF -> R16 -> R32
        if (b.championCount !== a.championCount)
          return b.championCount - a.championCount;
        if (b.finalistCount !== a.finalistCount)
          return b.finalistCount - a.finalistCount;
        if (b.semiFinalistCount !== a.semiFinalistCount)
          return b.semiFinalistCount - a.semiFinalistCount;
        if (b.quarterFinalistCount !== a.quarterFinalistCount)
          return b.quarterFinalistCount - a.quarterFinalistCount;
        if (b.r16Count !== a.r16Count) return b.r16Count - a.r16Count;
        return b.r32Count - a.r32Count;
      });
  }, [results, sortColumn, sortDirection]);

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

  const SortHeader = ({
    column,
    label,
    align = "right",
  }: {
    column: SortColumn;
    label: React.ReactNode;
    align?: "left" | "right";
  }) => (
    <th
      className={clsx(
        "px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none",
        align === "right" ? "text-right" : "text-left",
        sortColumn === column &&
          "text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50"
      )}
      onClick={() => handleSort(column)}
    >
      <div
        className={clsx(
          "flex items-center gap-1",
          align === "right" ? "justify-end" : "justify-start"
        )}
      >
        {label}
        {sortColumn === column && (
          <span className="text-[10px]">
            {sortDirection === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );

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
                Simula el resto del torneo {iterations.toLocaleString("es-ES")}{" "}
                veces para calcular las probabilidades de cada equipo.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVerify}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verificar
                </button>

                <select
                  value={iterations}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setIterations(val);
                    handleRun(val);
                  }}
                  disabled={isRunning}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={100}>100 simulaciones</option>
                  <option value={1000}>1.000 simulaciones</option>
                  <option value={5000}>5.000 simulaciones</option>
                  <option value={10000}>10.000 simulaciones</option>
                  <option value={50000}>50.000 simulaciones</option>
                  <option value={100000}>100.000 simulaciones</option>
                </select>

                <button
                  onClick={() => handleRun()}
                  disabled={isRunning}
                  className={clsx(
                    "min-w-[220px] px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md active:scale-95 flex justify-center items-center",
                    isRunning
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
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
              <div
                className={clsx(
                  "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono transition-opacity duration-300",
                  executionTime > 0 ? "opacity-100" : "opacity-0 select-none"
                )}
              >
                <Timer className="w-3 h-3" />
                <span>
                  {executionTime > 0 ? (
                    <>
                      {executionTime.toFixed(0)}ms (
                      {Math.round(
                        (iterations / executionTime) * 1000
                      ).toLocaleString("es-ES")}{" "}
                      sim/s)
                    </>
                  ) : (
                    "0ms (0 sim/s)"
                  )}
                </span>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">#</th>
                    <SortHeader column="teamName" label="Equipo" align="left" />
                    <SortHeader
                      column="teamRanking"
                      label={
                        <div className="flex items-center gap-1">
                          Ranking
                          <Tooltip content="Ranking FIFA" className="mx-0">
                            <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
                          </Tooltip>
                        </div>
                      }
                      align="right"
                    />
                    <SortHeader
                      column="teamFifaPoints"
                      label={
                        <div className="flex items-center gap-1">
                          Puntos
                          <Tooltip content="Puntuación FIFA" className="mx-0">
                            <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
                          </Tooltip>
                        </div>
                      }
                      align="right"
                    />
                    <SortHeader column="championCount" label="Campeón" />
                    <SortHeader column="finalistCount" label="Final" />
                    <SortHeader column="semiFinalistCount" label="Semis" />
                    <SortHeader column="quarterFinalistCount" label="Cuartos" />
                    <SortHeader column="r16Count" label="Octavos" />
                    <SortHeader column="r32Count" label="16avos" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedResults.map((team, index) => {
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
                          <div className="flex items-center gap-2">
                            <TeamFlag
                              teamName={team.teamName}
                              className="w-5 h-3.5 shadow-sm"
                            />
                            {team.teamName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">
                          {team.teamRanking ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">
                          {team.teamFifaPoints
                            ? team.teamFifaPoints.toFixed(0)
                            : "-"}
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

      {/* Verification Modal */}
      {showVerification && sampleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Verificación de Simulación
                </h3>
              </div>
              <button
                onClick={() => setShowVerification(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                Esta es una <strong>simulación única completa</strong> generada
                en este momento para verificar que la lógica del torneo se
                ejecuta correctamente paso a paso.
              </div>

              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-100 dark:border-slate-800">
                <div className="text-center sm:text-left">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">
                    Campeón Simulado
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
                    {sampleResult.champion?.name}
                    {sampleResult.champion?.ranking && (
                      <span className="text-sm font-normal text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        #{sampleResult.champion.ranking}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">
                    Final
                  </div>
                  <div className="text-lg font-medium text-slate-700 dark:text-slate-300">
                    {sampleResult.finalists[0]?.name} vs{" "}
                    {sampleResult.finalists[1]?.name}
                  </div>
                </div>
              </div>

              {/* Path to Glory */}
              <div>
                <h4 className="font-semibold mb-4 text-sm uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Camino del Campeón
                </h4>
                <div className="space-y-3 relative">
                  {/* Line connector */}
                  <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800"></div>

                  {sampleResult.matches
                    .filter((m) => m.winner?.id === sampleResult.champion?.id)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="relative flex items-center gap-4 text-sm p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                      >
                        <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-xs font-bold text-slate-500 dark:text-slate-400 z-10 border border-slate-200 dark:border-slate-800">
                          {m.stage}
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <div className="flex-1 flex items-center justify-between sm:justify-end gap-2 text-right">
                            <span
                              className={clsx(
                                "font-medium",
                                m.winner?.id === (m.homeTeam as Team).id
                                  ? "text-green-600 dark:text-green-400 font-bold"
                                  : "text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {(m.homeTeam as Team).name}
                            </span>
                          </div>
                          <div className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-center min-w-[80px]">
                            {m.homeScore} - {m.awayScore}
                            {(m.homePenalties || m.awayPenalties) && (
                              <div className="text-[10px] text-slate-500 font-normal">
                                ({m.homePenalties}-{m.awayPenalties})
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-between sm:justify-start gap-2 text-left">
                            <TeamFlag
                              teamName={(m.awayTeam as Team).name}
                              className="w-5 h-3.5 shadow-sm shrink-0"
                            />
                            <span
                              className={clsx(
                                "font-medium",
                                m.winner?.id === (m.awayTeam as Team).id
                                  ? "text-green-600 dark:text-green-400 font-bold"
                                  : "text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {(m.awayTeam as Team).name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => handleVerify()}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-700 dark:text-slate-200"
              >
                Generar otra prueba
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
