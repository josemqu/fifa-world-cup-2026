"use client";

import { useState, useMemo, useEffect, useCallback, Suspense, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTournament } from "@/context/TournamentContext";
import { useTheme } from "next-themes";
import { simulateTournament } from "@/utils/simulationUtils";
import { Tooltip } from "@/components/ui/Tooltip";
import { TeamFlag } from "@/components/ui/TeamFlag";
import {
  Info,
  Timer,
  CheckCircle2,
  X,
  AlertTriangle,
  Swords,
  TrendingUp,
  Search,
  ArrowUpDown,
  Filter,
  ChevronRight,
  Loader2,
  Target,
  Trophy,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Team, KnockoutMatch, MatchupData } from "@/data/types";
import { PageTransition } from "@/components/PageTransition";
import { SimulationOverlay } from "@/components/ui/SimulationOverlay";

// ── Predictions Tab Types & Helper ────────────────────────────────
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

// ── Matchups Tab Helpers ──────────────────────────────────────────
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
type MatchupSortColumn = "opponentName" | "totalProb" | "Grupos" | "R32" | "R16" | "QF" | "SF" | "Final" | "3rdPlace";

function getHeatmapClasses(pct: number): string {
  if (pct >= 100) return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold";
  if (pct >= 60) return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-bold";
  if (pct >= 30) return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold";
  if (pct >= 10) return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium";
  if (pct >= 1) return "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400";
  if (pct > 0) return "bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-500";
  return "text-slate-300 dark:text-slate-700";
}

function getLinearColorStyle(value: number, min: number, max: number, isDark: boolean) {
  if (max <= min) {
    return isDark
      ? { backgroundColor: "rgba(30, 41, 59, 0.4)", color: "#94a3b8" }
      : { backgroundColor: "#f1f5f9", color: "#475569" };
  }
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Interpolate RGBA values
  // Blue (low) -> Yellow (mid) -> Green (high)
  const interpolateRGBA = (
    c1: [number, number, number, number],
    c2: [number, number, number, number],
    factor: number
  ): string => {
    const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
    const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
    const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
    const a = c1[3] + factor * (c2[3] - c1[3]);
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  };

  if (isDark) {
    // Dark Mode Colors:
    // Blue (t = 0): bg = [23, 37, 84, 0.3] (blue-950/30), text = [148, 163, 184, 1] (slate-400 / gray)
    // Yellow (t = 0.5): bg = [74, 62, 8, 1], text = [245, 219, 137, 1]
    // Green (t = 1.0): bg = [11, 65, 29, 1], text = [137, 245, 173, 1]
    const bgBlue: [number, number, number, number] = [23, 37, 84, 0.3];
    const txtBlue: [number, number, number, number] = [148, 163, 184, 1];

    const bgYellow: [number, number, number, number] = [74, 62, 8, 1];
    const txtYellow: [number, number, number, number] = [245, 219, 137, 1];

    const bgGreen: [number, number, number, number] = [11, 65, 29, 1];
    const txtGreen: [number, number, number, number] = [137, 245, 173, 1];

    let bg: string;
    let txt: string;

    if (t < 0.5) {
      const factor = t * 2;
      bg = interpolateRGBA(bgBlue, bgYellow, factor);
      txt = interpolateRGBA(txtBlue, txtYellow, factor);
    } else {
      const factor = (t - 0.5) * 2;
      bg = interpolateRGBA(bgYellow, bgGreen, factor);
      txt = interpolateRGBA(txtYellow, txtGreen, factor);
    }

    return { backgroundColor: bg, color: txt };
  } else {
    // Light Mode Colors:
    // Blue (t = 0): bg = [239, 246, 255, 1] (blue-50), text = [100, 116, 139, 1] (slate-500 / gray)
    // Yellow (t = 0.5): bg = [254, 246, 204, 1], text = [121, 85, 6, 1]
    // Green (t = 1.0): bg = [220, 249, 230, 1], text = [12, 110, 45, 1]
    const bgBlue: [number, number, number, number] = [239, 246, 255, 1];
    const txtBlue: [number, number, number, number] = [100, 116, 139, 1];

    const bgYellow: [number, number, number, number] = [254, 246, 204, 1];
    const txtYellow: [number, number, number, number] = [121, 85, 6, 1];

    const bgGreen: [number, number, number, number] = [220, 249, 230, 1];
    const txtGreen: [number, number, number, number] = [12, 110, 45, 1];

    let bg: string;
    let txt: string;

    if (t < 0.5) {
      const factor = t * 2;
      bg = interpolateRGBA(bgBlue, bgYellow, factor);
      txt = interpolateRGBA(txtBlue, txtYellow, factor);
    } else {
      const factor = (t - 0.5) * 2;
      bg = interpolateRGBA(bgYellow, bgGreen, factor);
      txt = interpolateRGBA(txtYellow, txtGreen, factor);
    }

    return { backgroundColor: bg, color: txt };
  }
}

function PredictionsPageContent() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const {
    groups,
    knockoutMatches,
    predictions,
    matchupResults,
    simulationIterations,
    simulationTime,
    setSimulationResults,
    clearSimulationResults,
    isSimulationStale,
  } = useTournament();

  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State syncing with search params
  const activeTab = (searchParams.get("tab") as "predictions" | "matchups") || "predictions";

  const setActiveTab = (tab: "predictions" | "matchups") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/predictions?${params.toString()}`, { scroll: false });
  };

  const canRunSimulation = !!user && !authLoading;

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [iterations, setIterations] = useState(simulationIterations);
  const [isMounted, setIsMounted] = useState(false);
  const isDark = isMounted && resolvedTheme === "dark";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIterations(simulationIterations);
  }, [simulationIterations]);

  // Sort State for Predictions
  const [sortColumn, setSortColumn] = useState<SortColumn>("championCount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Sort and filter state for Matchups
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [matchupSortColumn, setMatchupSortColumn] = useState<MatchupSortColumn>("totalProb");
  const [matchupSortDir, setMatchupSortDir] = useState<"asc" | "desc">("desc");
  const [hasInitializedMatchups, setHasInitializedMatchups] = useState(false);

  // Verification State
  const [showVerification, setShowVerification] = useState(false);
  const [sampleResult, setSampleResult] = useState<{
    champion?: Team;
    finalists: Team[];
    matches: KnockoutMatch[];
  } | null>(null);

  const teamNames = useMemo(() => {
    return groups.flatMap((g) => g.teams).map((t) => t.name);
  }, [groups]);

  // Flat teams list for Matchups tab
  const allTeams = useMemo(() => {
    const teams = groups.flatMap((g) => g.teams);
    return teams.sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  // Matchups Tab Initialization
  useEffect(() => {
    if (allTeams.length === 0) return;
    const isProfileLoading = authLoading || (!!user && !dbUser);
    if (isProfileLoading) return;

    if (!hasInitializedMatchups) {
      if (dbUser?.favoriteTeam) {
        const favTeam = allTeams.find(
          (t) => t.name.toLowerCase() === dbUser.favoriteTeam?.toLowerCase()
        );
        if (favTeam) {
          setSelectedTeamId(favTeam.id);
          setHasInitializedMatchups(true);
          return;
        }
      }
      if (!selectedTeamId) {
        setSelectedTeamId(allTeams[0].id);
      }
      setHasInitializedMatchups(true);
    }
  }, [allTeams, dbUser, user, authLoading, hasInitializedMatchups, selectedTeamId]);

  const filteredSelectorTeams = useMemo(() => {
    if (!searchQuery) return allTeams;
    const q = searchQuery.toLowerCase();
    return allTeams.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTeams, searchQuery]);

  const selectedData = useMemo(() => {
    if (!selectedTeamId) return null;
    return matchupResults.find((d) => d.teamId === selectedTeamId) || null;
  }, [matchupResults, selectedTeamId]);

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

  const filteredAndSortedRows = useMemo(() => {
    let rows = [...opponentRows];

    if (stageFilter !== "all") {
      rows = rows.filter((r) => (r.stageCounts[stageFilter] || 0) > 0);
    }

    rows.sort((a, b) => {
      let cmp = 0;
      if (matchupSortColumn === "opponentName") {
        cmp = a.opponentName.localeCompare(b.opponentName);
      } else if (matchupSortColumn === "totalProb") {
        cmp = a.totalProb - b.totalProb;
      } else {
        cmp = (a.stageProbs[matchupSortColumn] || 0) - (b.stageProbs[matchupSortColumn] || 0);
      }
      return matchupSortDir === "desc" ? -cmp : cmp;
    });

    return rows;
  }, [opponentRows, stageFilter, matchupSortColumn, matchupSortDir]);

  const summaryStats = useMemo(() => {
    if (opponentRows.length === 0) return null;

    const knockoutRows = opponentRows.filter((r) => {
      const knockoutProb = KNOCKOUT_STAGES.reduce((s, st) => s + (r.stageProbs[st] || 0), 0);
      return knockoutProb > 0;
    });

    let topRival = { name: "-", prob: 0, stage: "-" };
    let fallbackRival = { name: "-", prob: 0, stage: "-" };

    knockoutRows.forEach((r) => {
      KNOCKOUT_STAGES.forEach((st) => {
        const p = r.stageProbs[st] || 0;
        if (p < 100 && p > topRival.prob) {
          topRival = { name: r.opponentName, prob: p, stage: STAGE_LABELS[st] || st };
        }
        if (p > fallbackRival.prob) {
          fallbackRival = { name: r.opponentName, prob: p, stage: STAGE_LABELS[st] || st };
        }
      });
    });

    if (topRival.name === "-") {
      topRival = fallbackRival;
    }

    const stageTotals: Record<string, number> = {};
    KNOCKOUT_STAGES.forEach((st) => {
      let maxProb = 0;
      opponentRows.forEach((r) => {
        maxProb += r.stageProbs[st] || 0;
      });
      stageTotals[st] = Math.min(100, maxProb);
    });

    const finalRivals = opponentRows
      .filter((r) => (r.stageProbs["Final"] || 0) > 0)
      .sort((a, b) => (b.stageProbs["Final"] || 0) - (a.stageProbs["Final"] || 0))
      .slice(0, 3);

    return { topRival, stageTotals, finalRivals };
  }, [opponentRows]);

  const handleRun = async (numIterations: number = iterations) => {
    setIsRunning(true);
    setProgress(0);
    setCurrentIteration(0);
    clearSimulationResults();

    await new Promise((resolve) => setTimeout(resolve, 150));

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
      const { status, progress, currentIteration, error, elapsedMs } = e.data;

      if (status === "progress") {
        setProgress(progress);
        setCurrentIteration(currentIteration);
      } else if (status === "success") {
        setSimulationResults(e.data.predictions, e.data.matchups, e.data.knockoutProbabilities, numIterations, elapsedMs);
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

  const handleVerify = () => {
    const result = simulateTournament(groups, knockoutMatches);
    const final = result.knockoutMatches.find((m) => m.stage === "Final");
    const champion = final?.winner || undefined;
    const finalists = [final?.homeTeam, final?.awayTeam].filter(
      (t) => t && !("placeholder" in t),
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
      setSortDirection(column === "teamRanking" ? "asc" : "desc");
    }
  };

  const handleMatchupSort = (col: MatchupSortColumn) => {
    if (matchupSortColumn === col) {
      setMatchupSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setMatchupSortColumn(col);
      setMatchupSortDir(col === "opponentName" ? "asc" : "desc");
    }
  };

  const sortedResults = useMemo(() => {
    return [...predictions]
      .filter((r) => r.r32Count > 0)
      .sort((a, b) => {
        let comparison = 0;

        if (sortColumn === "teamName") {
          comparison = a.teamName.localeCompare(b.teamName);
        } else if (sortColumn === "teamRanking") {
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

        if (sortColumn === "teamName") {
          if (sortDirection === "desc") {
            comparison = b.teamName.localeCompare(a.teamName);
          }
        } else if (sortColumn === "teamRanking") {
          if (sortDirection === "desc") {
            const rankA = a.teamRanking ?? 999;
            const rankB = b.teamRanking ?? 999;
            comparison = rankB - rankA;
          }
        } else if (sortColumn === "teamFifaPoints") {
          if (sortDirection === "desc") {
            const pointsA = a.teamFifaPoints ?? 0;
            const pointsB = b.teamFifaPoints ?? 0;
            comparison = pointsB - pointsA;
          }
        } else {
          if (sortDirection === "desc") {
            comparison = (b[sortColumn] as number) - (a[sortColumn] as number);
          }
        }

        if (comparison !== 0) return comparison;

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
  }, [predictions, sortColumn, sortDirection]);

  const columnBounds = useMemo(() => {
    if (sortedResults.length === 0) {
      return {
        r32Count: { min: 0, max: 0 },
        r16Count: { min: 0, max: 0 },
        quarterFinalistCount: { min: 0, max: 0 },
        semiFinalistCount: { min: 0, max: 0 },
        finalistCount: { min: 0, max: 0 },
        championCount: { min: 0, max: 0 },
      };
    }

    const r32Vals = sortedResults.map((t) => t.r32Count);
    const r16Vals = sortedResults.map((t) => t.r16Count);
    const qfVals = sortedResults.map((t) => t.quarterFinalistCount);
    const sfVals = sortedResults.map((t) => t.semiFinalistCount);
    const finalVals = sortedResults.map((t) => t.finalistCount);
    const champVals = sortedResults.map((t) => t.championCount);

    return {
      r32Count: { min: Math.min(...r32Vals), max: Math.max(...r32Vals) },
      r16Count: { min: Math.min(...r16Vals), max: Math.max(...r16Vals) },
      quarterFinalistCount: { min: Math.min(...qfVals), max: Math.max(...qfVals) },
      semiFinalistCount: { min: Math.min(...sfVals), max: Math.max(...sfVals) },
      finalistCount: { min: Math.min(...finalVals), max: Math.max(...finalVals) },
      championCount: { min: Math.min(...champVals), max: Math.max(...champVals) },
    };
  }, [sortedResults]);

  const renderPercentageCell = (count: number, col: keyof typeof columnBounds) => {
    const pct = (count / iterations) * 100;
    if (pct > 0) {
      const bounds = columnBounds[col];
      const style = getLinearColorStyle(count, bounds.min, bounds.max, isDark);
      return (
        <span
          style={style}
          className="inline-block min-w-[48px] text-center text-xs px-1.5 py-0.5 rounded font-medium transition-colors duration-200"
        >
          {pct >= 100 ? "100%" : `${pct.toFixed(1)}%`}
        </span>
      );
    }
    return <span className="text-xs text-slate-300 dark:text-slate-750">—</span>;
  };

  const selectedTeam = allTeams.find((t) => t.id === selectedTeamId);

  // ── Render Helpers ──────────────────────────────────────────────
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
        "px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none",
        align === "right" ? "text-right" : "text-left",
        sortColumn === column &&
          "text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50",
      )}
      onClick={() => handleSort(column)}
    >
      <div
        className={clsx(
          "flex items-center gap-1",
          align === "right" ? "justify-end" : "justify-start",
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

  const MatchupSortHeader = ({
    column,
    label,
    align = "right",
  }: {
    column: MatchupSortColumn;
    label: ReactNode;
    align?: "left" | "right";
  }) => (
    <th
      className={clsx(
        "px-2 md:px-3 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none text-[11px] md:text-xs whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        matchupSortColumn === column && "text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50"
      )}
      onClick={() => handleMatchupSort(column)}
    >
      <div className={clsx("flex items-center gap-1", align === "right" ? "justify-end" : "justify-start")}>
        {label}
        {matchupSortColumn === column && <span className="text-[10px]">{matchupSortDir === "asc" ? "▲" : "▼"}</span>}
      </div>
    </th>
  );

  return (
    <PageTransition className="max-w-[1600px] mx-auto p-4 md:p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ─── Unified Control & Info Header ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                El Oráculo del Mundial 2026
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-2xl">
                Proyectá miles de escenarios del torneo en tiempo real. Utilizando rankings FIFA, el rendimiento actual de cada selección y los resultados actuales, estimamos las probabilidades matemáticas de salir campeón y los cruces más probables en cada etapa.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/predictions/metodologia"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/80"
              >
                <Info className="w-3.5 h-3.5" />
                Cómo funciona
              </Link>
              <button
                onClick={handleVerify}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/80 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verificar
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">Configuración:</label>
              <select
                value={iterations}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setIterations(val);
                  if (canRunSimulation) {
                    handleRun(val);
                  }
                }}
                disabled={isRunning || !canRunSimulation}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
              >
                <option value={100}>100 simulaciones</option>
                <option value={1000}>1.000 simulaciones</option>
                <option value={5000}>5.000 simulaciones</option>
                <option value={10000}>10.000 simulaciones</option>
                <option value={50000}>50.000 simulaciones</option>
                <option value={100000}>100.000 simulaciones</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              {predictions.length > 0 && !isRunning && (
                <button
                  onClick={clearSimulationResults}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
              {isMounted ? (
                <button
                  onClick={() => handleRun()}
                  disabled={isRunning || !canRunSimulation}
                  className={clsx(
                    "w-full sm:w-auto min-w-[150px] px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-md active:scale-95 flex justify-center items-center gap-1.5",
                    isRunning || !canRunSimulation
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25",
                  )}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Simulando...
                    </>
                  ) : (
                    <>
                      <Swords className="w-3.5 h-3.5" />
                      Ejecutar Simulación
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full sm:w-auto min-w-[150px] h-8" />
              )}
            </div>
          </div>

          {!authLoading && !user && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-right">
              Para correr la simulación debés registrarte e iniciar sesión.
            </div>
          )}

          <div
            className={clsx(
              "flex items-center justify-end gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono transition-opacity duration-300 mt-1",
              simulationTime > 0 ? "opacity-100" : "opacity-0 select-none",
            )}
          >
            <Timer className="w-3 h-3" />
            <span>
              {simulationTime > 0 ? (
                <>
                  {simulationTime.toFixed(0)}ms (
                  {Math.round(
                    (simulationIterations / simulationTime) * 1000,
                  ).toLocaleString("es-ES")}{" "}
                  sim/s)
                </>
              ) : (
                "0ms"
              )}
            </span>
          </div>
        </div>

        {/* ─── Stale Simulation Warning Banner ─── */}
        <AnimatePresence>
          {isSimulationStale && predictions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start sm:items-center gap-3 text-amber-800 dark:text-amber-300 shadow-xs">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold">Simulación desactualizada</h4>
                    <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                      Los resultados de los partidos cambiaron. Te recomendamos volver a ejecutar la simulación para obtener probabilidades actualizadas.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRun()}
                    disabled={isRunning || !canRunSimulation}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Simular ahora
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Sub-tab Selector ─── */}
        <div className="flex p-1 gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-sm shadow-inner border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-max">
          <button
            onClick={() => setActiveTab("predictions")}
            className={clsx(
              "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "predictions"
                ? "text-blue-600 dark:text-blue-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "predictions" && (
              <motion.div
                layoutId="predictionsSubTab"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Probabilidades de Avance
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("matchups")}
            className={clsx(
              "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "matchups"
                ? "text-blue-600 dark:text-blue-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "matchups" && (
              <motion.div
                layoutId="predictionsSubTab"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Swords className="w-3.5 h-3.5" />
              Explorador de Cruces
            </span>
          </button>
        </div>

        {/* ─── Sub-tab Content ─── */}
        <AnimatePresence mode="wait">
          {activeTab === "predictions" ? (
            <motion.div
              key="predictions-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {predictions.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
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
                          <SortHeader column="r32Count" label="16avos" />
                          <SortHeader column="r16Count" label="Octavos" />
                          <SortHeader column="quarterFinalistCount" label="Cuartos" />
                          <SortHeader column="semiFinalistCount" label="Semis" />
                          <SortHeader column="finalistCount" label="Final" />
                          <SortHeader column="championCount" label="Campeón" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedResults.map((team, index) => {
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
                              <td className="px-4 py-3 text-right">
                                {renderPercentageCell(team.r32Count, "r32Count")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {renderPercentageCell(team.r16Count, "r16Count")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {renderPercentageCell(team.quarterFinalistCount, "quarterFinalistCount")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {renderPercentageCell(team.semiFinalistCount, "semiFinalistCount")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {renderPercentageCell(team.finalistCount, "finalistCount")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {renderPercentageCell(team.championCount, "championCount")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                !isRunning && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                      Presioná <strong>&quot;Ejecutar Simulación&quot;</strong> arriba para ver las probabilidades de avance.
                    </p>
                  </div>
                )
              )}
            </motion.div>
          ) : (
            <motion.div
              key="matchups-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* ─── Team Selector & Search Card ─── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar equipo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none border-none"
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
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <TeamFlag teamName={selectedTeam.name} className="w-5 h-3.5 shadow-sm" />
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{selectedTeam.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                    {filteredSelectorTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={clsx(
                          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border cursor-pointer",
                          selectedTeamId === team.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-105"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                        )}
                      >
                        <TeamFlag teamName={team.name} className="w-4 h-3 shadow-sm" />
                        <span className="whitespace-nowrap">{team.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ─── Matchup Results ─── */}
              {matchupResults.length > 0 && selectedTeamId ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  {summaryStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Top Knockout Rival */}
                      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-blue-500/5 blur-xl" />
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Rival más probable
                          </span>
                          <Tooltip content="El rival con el que este equipo tiene la mayor probabilidad de cruzarse en alguna ronda de eliminación directa." placement="top">
                            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                          <TeamFlag teamName={summaryStats.topRival.name} className="w-6 h-4 shadow-sm" />
                          <span className="text-lg font-bold text-slate-900 dark:text-white">{summaryStats.topRival.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {summaryStats.topRival.prob.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            en {summaryStats.topRival.stage}
                          </span>
                        </div>
                      </div>

                      {/* Stage Probabilities */}
                      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-indigo-500/5 blur-xl" />
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-indigo-500" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Avance por ronda
                          </span>
                          <Tooltip content="La probabilidad estimada de que este equipo clasifique y dispute cada ronda de la segunda fase." placement="top">
                            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-help" />
                          </Tooltip>
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
                          <Tooltip content="Los tres oponentes más probables a enfrentar en la final y la probabilidad de cruzarse en dicho partido." placement="top">
                            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-help" />
                          </Tooltip>
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

                  {/* Stage Filtering & Table */}
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
                              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                              stageFilter === stage
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            {stage === "all" ? "Todas" : STAGE_LABELS[stage] || stage}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto p-4 md:p-6">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="px-2 md:px-3 py-3 w-8">#</th>
                            <MatchupSortHeader column="opponentName" label="Oponente" align="left" />
                            <MatchupSortHeader
                              column="totalProb"
                              label={
                                <div className="flex items-center gap-1">
                                  <ArrowUpDown className="w-3 h-3" />
                                  Total
                                </div>
                              }
                            />
                            {STAGE_ORDER.map((stage) => (
                              <MatchupSortHeader key={stage} column={stage as MatchupSortColumn} label={STAGE_LABELS[stage]} />
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
                                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                          : row.totalProb >= 10
                                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
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
                                        <span className="text-xs text-slate-300 dark:text-slate-750">—</span>
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
                </div>
              ) : (
                !isRunning && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                      <Swords className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                      Presioná <strong>&quot;Ejecutar Simulación&quot;</strong> arriba para ver las probabilidades de cruces de tu selección favorita.
                    </p>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Simulation Overlay ─── */}
      <SimulationOverlay
        isOpen={isRunning}
        progress={progress}
        currentIteration={currentIteration}
        totalIterations={iterations}
        teamNames={teamNames}
        type={activeTab}
      />

      {/* ─── Verification Modal ─── */}
      {showVerification && sampleResult && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="verification-modal-scroll bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
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
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
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
                                  : "text-slate-600 dark:text-slate-400",
                              )}
                            >
                              {(m.homeTeam as Team).name}
                            </span>
                            <TeamFlag
                              teamName={(m.homeTeam as Team).name}
                              className="w-5 h-3.5 shadow-sm shrink-0"
                            />
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
                                  : "text-slate-600 dark:text-slate-400",
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
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Generar otra prueba
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    }>
      <PredictionsPageContent />
    </Suspense>
  );
}
