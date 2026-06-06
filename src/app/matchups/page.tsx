"use client";

import { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { useTournament } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";
import { runMatchupMonteCarlo } from "@/utils/matchupMonteCarlo";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { PageTransition } from "@/components/PageTransition";
import { MatchupData } from "@/data/types";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Timer,
  Search,
  X,
  TrendingUp,
  Target,
  Trophy,
  ArrowUpDown,
  Filter,
  ChevronRight,
} from "lucide-react";

// ── Stage helpers ──────────────────────────────────────────────
const STAGE_ORDER = ["Grupos", "R32", "R16", "QF", "SF", "Final", "3rdPlace"] as const;
const STAGE_LABELS: Record<string, string> = {
  Grupos: "Grupos",
  R32: "16avos",
  R16: "Octavos",
  QF: "Cuartos",
  SF: "Semis",
  Final: "Final",
  "3rdPlace": "3er Puesto",
};
const KNOCKOUT_STAGES = ["R32", "R16", "QF", "SF", "Final", "3rdPlace"] as const;

type StageFilter = "all" | (typeof STAGE_ORDER)[number];
type SortColumn = "opponentName" | "totalProb" | "Grupos" | "R32" | "R16" | "QF" | "SF" | "Final" | "3rdPlace";

// ── Heatmap color helper ───────────────────────────────────────
function getHeatmapClasses(pct: number): string {
  if (pct >= 100) return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold";
  if (pct >= 60) return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-bold";
  if (pct >= 30) return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold";
  if (pct >= 10) return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium";
  if (pct >= 1) return "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400";
  if (pct > 0) return "bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-500";
  return "text-slate-300 dark:text-slate-700";
}

// ── Main Page ─────────────────────────────────────────────────
export default function MatchupsPage() {
  const { groups, knockoutMatches } = useTournament();
  const { user, loading: authLoading } = useAuth();
  const canRun = !!user && !authLoading;

  // Simulation state
  const [matchupResults, setMatchupResults] = useState<MatchupData[]>([]);
  const [iterations, setIterations] = useState(5000);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // UI state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("totalProb");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── All teams flat list ──────────────────────────────────────
  const allTeams = useMemo(() => {
    const teams = groups.flatMap((g) => g.teams);
    return teams.sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  // Auto-select first team if none selected
  useEffect(() => {
    if (!selectedTeamId && allTeams.length > 0) {
      setSelectedTeamId(allTeams[0].id);
    }
  }, [allTeams, selectedTeamId]);

  // ── Filtered teams for the selector ──────────────────────────
  const filteredSelectorTeams = useMemo(() => {
    if (!searchQuery) return allTeams;
    const q = searchQuery.toLowerCase();
    return allTeams.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTeams, searchQuery]);

  // ── Run simulation ──────────────────────────────────────────
  const handleRun = useCallback(
    async (numIterations: number = iterations) => {
      setIsRunning(true);
      setMatchupResults([]);
      setTimeout(async () => {
        const start = performance.now();
        const data = await runMatchupMonteCarlo(groups, knockoutMatches, numIterations);
        const end = performance.now();
        setElapsedMs(end - start);
        setMatchupResults(data);
        setIsRunning(false);
      }, 50);
    },
    [groups, knockoutMatches, iterations]
  );

  // ── Selected team's matchup data ────────────────────────────
  const selectedData = useMemo(() => {
    if (!selectedTeamId) return null;
    return matchupResults.find((d) => d.teamId === selectedTeamId) || null;
  }, [matchupResults, selectedTeamId]);

  // ── Build opponent rows from matchup data ───────────────────
  type OpponentRow = {
    opponentId: string;
    opponentName: string;
    totalCount: number;
    totalProb: number;
    stageCounts: Record<string, number>;
    stageProbs: Record<string, number>;
  };

  const opponentRows: OpponentRow[] = useMemo(() => {
    if (!selectedData) return [];

    // Group by opponent
    const byOpponent = new Map<string, { name: string; stages: Record<string, number> }>();

    selectedData.matchups.forEach((m) => {
      if (!byOpponent.has(m.opponentId)) {
        byOpponent.set(m.opponentId, { name: m.opponentName, stages: {} });
      }
      const entry = byOpponent.get(m.opponentId)!;
      entry.stages[m.stage] = (entry.stages[m.stage] || 0) + m.count;
    });

    const rows: OpponentRow[] = [];
    byOpponent.forEach((val, oppId) => {
      const stageCounts: Record<string, number> = {};
      const stageProbs: Record<string, number> = {};
      let knockoutTotal = 0;

      STAGE_ORDER.forEach((s) => {
        const c = val.stages[s] || 0;
        stageCounts[s] = c;
        stageProbs[s] = (c / iterations) * 100;
        if (s !== "Grupos") {
          knockoutTotal += c;
        }
      });

      // Total probability = probability of facing this opponent in at least one knockout stage
      // Since group matches are deterministic, we separate them
      const isGroupRival = (stageCounts["Grupos"] || 0) > 0;
      const totalKnockoutProb = (knockoutTotal / iterations) * 100;

      rows.push({
        opponentId: oppId,
        opponentName: val.name,
        totalCount: knockoutTotal + (stageCounts["Grupos"] || 0),
        totalProb: isGroupRival ? 100 + totalKnockoutProb : totalKnockoutProb,
        stageCounts,
        stageProbs,
      });
    });

    return rows;
  }, [selectedData, iterations]);

  // ── Filter + Sort ───────────────────────────────────────────
  const filteredAndSortedRows = useMemo(() => {
    let rows = [...opponentRows];

    // Filter by stage
    if (stageFilter !== "all") {
      rows = rows.filter((r) => (r.stageCounts[stageFilter] || 0) > 0);
    }

    // Sort
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "opponentName") {
        cmp = a.opponentName.localeCompare(b.opponentName);
      } else if (sortColumn === "totalProb") {
        cmp = a.totalProb - b.totalProb;
      } else {
        // Stage column
        cmp = (a.stageProbs[sortColumn] || 0) - (b.stageProbs[sortColumn] || 0);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return rows;
  }, [opponentRows, stageFilter, sortColumn, sortDir]);

  // ── Summary stats ───────────────────────────────────────────
  const summaryStats = useMemo(() => {
    if (opponentRows.length === 0) return null;

    // Most probable knockout rival
    const knockoutRows = opponentRows.filter((r) => {
      const knockoutProb = KNOCKOUT_STAGES.reduce((s, st) => s + (r.stageProbs[st] || 0), 0);
      return knockoutProb > 0;
    });

    let topRival = { name: "-", prob: 0, stage: "-" };
    knockoutRows.forEach((r) => {
      KNOCKOUT_STAGES.forEach((st) => {
        const p = r.stageProbs[st] || 0;
        if (p > topRival.prob) {
          topRival = { name: r.opponentName, prob: p, stage: STAGE_LABELS[st] || st };
        }
      });
    });

    // Most probable stage to reach
    const stageTotals: Record<string, number> = {};
    KNOCKOUT_STAGES.forEach((st) => {
      let maxProb = 0;
      opponentRows.forEach((r) => {
        maxProb += r.stageProbs[st] || 0;
      });
      // maxProb / 2 because each matchup is counted from both sides conceptually
      // Actually: the sum of all opponent probs for a stage = probability of being in that stage * 1
      // (the team faces exactly 1 opponent per stage, so the sum = P(reaching stage))
      stageTotals[st] = Math.min(100, maxProb);
    });

    // Potential final rivals
    const finalRivals = opponentRows
      .filter((r) => (r.stageProbs["Final"] || 0) > 0)
      .sort((a, b) => (b.stageProbs["Final"] || 0) - (a.stageProbs["Final"] || 0))
      .slice(0, 3);

    return { topRival, stageTotals, finalRivals };
  }, [opponentRows]);

  // ── Sort handler ────────────────────────────────────────────
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDir(col === "opponentName" ? "asc" : "desc");
    }
  };

  const selectedTeam = allTeams.find((t) => t.id === selectedTeamId);

  // ── SortHeader component ────────────────────────────────────
  const SortHeader = ({
    column,
    label,
    align = "right",
  }: {
    column: SortColumn;
    label: ReactNode;
    align?: "left" | "right";
  }) => (
    <th
      className={clsx(
        "px-2 md:px-3 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none text-[11px] md:text-xs whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        sortColumn === column && "text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50"
      )}
      onClick={() => handleSort(column)}
    >
      <div className={clsx("flex items-center gap-1", align === "right" ? "justify-end" : "justify-start")}>
        {label}
        {sortColumn === column && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
      </div>
    </th>
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <PageTransition className="max-w-[1600px] mx-auto p-4 md:p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header Card ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Explorador de Cruces
                </h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl">
                Seleccioná un equipo y descubrí la probabilidad de enfrentarse con cada rival en cada instancia del torneo.
              </p>
            </div>

            <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                <select
                  value={iterations}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setIterations(val);
                    if (canRun) handleRun(val);
                  }}
                  disabled={isRunning || !canRun}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none w-full sm:w-auto"
                >
                  <option value={100}>100 simulaciones</option>
                  <option value={1000}>1.000 simulaciones</option>
                  <option value={5000}>5.000 simulaciones</option>
                  <option value={10000}>10.000 simulaciones</option>
                  <option value={50000}>50.000 simulaciones</option>
                </select>

                {isMounted && (
                  <button
                    onClick={() => handleRun()}
                    disabled={isRunning || !canRun}
                    className={clsx(
                      "w-full sm:w-auto min-w-[200px] px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md active:scale-95 flex justify-center items-center gap-2",
                      isRunning || !canRun
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-violet-500/25"
                    )}
                  >
                    {isRunning ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Simulando...
                      </>
                    ) : (
                      <>
                        <Swords className="w-4 h-4" />
                        Ejecutar Simulación
                      </>
                    )}
                  </button>
                )}
              </div>
              {!authLoading && !user && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Para correr la simulación debés registrarte e iniciar sesión.
                </div>
              )}
              <div
                className={clsx(
                  "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono transition-opacity duration-300",
                  elapsedMs > 0 ? "opacity-100" : "opacity-0 select-none"
                )}
              >
                <Timer className="w-3 h-3" />
                <span>
                  {elapsedMs > 0 ? (
                    <>
                      {elapsedMs.toFixed(0)}ms ({Math.round((iterations / elapsedMs) * 1000).toLocaleString("es-ES")} sim/s)
                    </>
                  ) : (
                    "0ms"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Team Selector ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar equipo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 outline-none border-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
              {selectedTeam && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                  <TeamFlag teamName={selectedTeam.name} className="w-5 h-3.5 shadow-sm" />
                  <span className="text-sm font-bold text-violet-700 dark:text-violet-300">{selectedTeam.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {filteredSelectorTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={clsx(
                    "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border",
                    selectedTeamId === team.id
                      ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/25 scale-105"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/10"
                  )}
                >
                  <TeamFlag teamName={team.name} className="w-4 h-3 shadow-sm" />
                  <span className="whitespace-nowrap">{team.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Results Section ─── */}
        <AnimatePresence mode="wait">
          {matchupResults.length > 0 && selectedTeamId ? (
            <motion.div
              key={selectedTeamId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* ─── Summary Cards ─── */}
              {summaryStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Top Knockout Rival */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-500/5 blur-xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-violet-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Rival más probable
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamFlag teamName={summaryStats.topRival.name} className="w-6 h-4 shadow-sm" />
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{summaryStats.topRival.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                        {summaryStats.topRival.prob.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        en {summaryStats.topRival.stage}
                      </span>
                    </div>
                  </div>

                  {/* Stage Probabilities */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-blue-500/5 blur-xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Avance por ronda
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {KNOCKOUT_STAGES.filter((s) => s !== "3rdPlace").map((stage) => {
                        const pct = summaryStats.stageTotals[stage] || 0;
                        return (
                          <div key={stage} className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-14 text-right">
                              {STAGE_LABELS[stage]}
                            </span>
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, pct)}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Potential Final Rivals */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/5 blur-xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Rivales en la Final
                      </span>
                    </div>
                    {summaryStats.finalRivals.length > 0 ? (
                      <div className="space-y-2">
                        {summaryStats.finalRivals.map((r, i) => (
                          <div key={r.opponentId} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}.</span>
                            <TeamFlag teamName={r.opponentName} className="w-5 h-3.5 shadow-sm" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">
                              {r.opponentName}
                            </span>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                              {(r.stageProbs["Final"] || 0).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-600">Sin datos de final.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Stage Filter Tabs ─── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 md:px-6 pt-4 md:pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filtrar por instancia</span>
                  </div>
                  <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
                    {(["all", ...STAGE_ORDER] as StageFilter[]).map((stage) => (
                      <button
                        key={stage}
                        onClick={() => setStageFilter(stage)}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                          stageFilter === stage
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {stage === "all" ? "Todas" : STAGE_LABELS[stage] || stage}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Main Matchup Table ─── */}
                <div className="overflow-x-auto p-4 md:p-6">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="px-2 md:px-3 py-3 w-8">#</th>
                        <SortHeader column="opponentName" label="Oponente" align="left" />
                        <SortHeader
                          column="totalProb"
                          label={
                            <div className="flex items-center gap-1">
                              <ArrowUpDown className="w-3 h-3" />
                              Total
                            </div>
                          }
                        />
                        {STAGE_ORDER.map((stage) => (
                          <SortHeader key={stage} column={stage as SortColumn} label={STAGE_LABELS[stage]} />
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAndSortedRows.map((row, index) => {
                        const isGroupRival = (row.stageCounts["Grupos"] || 0) > 0;
                        return (
                          <tr
                            key={row.opponentId}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm group cursor-pointer"
                            onClick={() => setSelectedTeamId(row.opponentId)}
                          >
                            <td className="px-2 md:px-3 py-3 text-slate-400 dark:text-slate-600 font-mono text-xs">
                              {index + 1}
                            </td>
                            <td className="px-2 md:px-3 py-3">
                              <div className="flex items-center gap-2">
                                <TeamFlag teamName={row.opponentName} className="w-5 h-3.5 shadow-sm" />
                                <span className="font-medium text-slate-900 dark:text-white">{row.opponentName}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                            <td className="px-2 md:px-3 py-3 text-right">
                              <span
                                className={clsx(
                                  "text-xs font-bold px-2 py-0.5 rounded-full",
                                  isGroupRival
                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                    : row.totalProb >= 30
                                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                      : row.totalProb >= 10
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                )}
                              >
                                {isGroupRival ? "Grupo" : `${row.totalProb.toFixed(1)}%`}
                              </span>
                            </td>
                            {STAGE_ORDER.map((stage) => {
                              const pct = row.stageProbs[stage] || 0;
                              return (
                                <td key={stage} className="px-2 md:px-3 py-3 text-right">
                                  {pct > 0 ? (
                                    <span
                                      className={clsx(
                                        "inline-block min-w-[48px] text-center text-xs px-1.5 py-0.5 rounded",
                                        getHeatmapClasses(pct)
                                      )}
                                    >
                                      {pct >= 100 ? "100%" : `${pct.toFixed(1)}%`}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-300 dark:text-slate-700">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredAndSortedRows.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                      <p className="text-sm">No hay enfrentamientos para el filtro seleccionado.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            !isRunning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-4">
                  <Swords className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                  Seleccioná un equipo y presioná <strong>&quot;Ejecutar Simulación&quot;</strong> para descubrir las probabilidades de cada cruce en el torneo.
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
