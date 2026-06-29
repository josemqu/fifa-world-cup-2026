"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Flame,
} from "lucide-react";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { calculatePoints } from "@/utils/prodeUtils";
import { Group, KnockoutMatch, Team } from "@/data/types";
import { INITIAL_GROUPS } from "@/data/initialData";
import {
  R32_MATCHES,
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";
import { KNOCKOUT_DETAILS } from "@/data/knockoutDetails";
import { generateR32Matches } from "@/utils/knockoutUtils";
import { recalculateGroupStats } from "@/utils/simulationUtils";
import { clsx } from "clsx";
import { useTournament } from "@/context/TournamentContext";


interface DbUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  nickname?: string;
  country?: string;
  favoriteTeam?: string;
  predictionCount: number;
}

interface PredictionEntry {
  matchId: string;
  homeScore: number | "";
  awayScore: number | "";
  homePenalties?: number | "";
  awayPenalties?: number | "";
}

interface PredictionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: DbUser;
  adminUid: string;
}

const GROUP_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const KNOCKOUT_STAGES = [
  { key: "R32", label: "16avos" },
  { key: "R16", label: "Octavos" },
  { key: "QF", label: "Cuartos" },
  { key: "SF", label: "Semis" },
  { key: "Final", label: "Final" },
];

function formatPlaceholder(ph: string): string {
  if (!ph) return "Por definir";
  if (/^[1-3][A-L]$/.test(ph)) {
    const rank = ph.charAt(0);
    const group = ph.charAt(1);
    return `${rank}° Grupo ${group}`;
  }
  if (ph.startsWith("W")) return `Ganador #${ph.substring(1)}`;
  if (ph.startsWith("L")) return `Perdedor #${ph.substring(1)}`;
  return ph;
}

// Full Match Metadata Map
const MATCH_LOOKUP = (() => {
  const map = new Map<string, { homeTeamName: string; awayTeamName: string; utcDate: string; stage: string; groupId?: string; label?: string }>();
  for (const group of INITIAL_GROUPS) {
    for (const match of group.matches) {
      const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
      const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);
      map.set(match.id, {
        homeTeamName: homeTeam?.name || match.homeTeamId,
        awayTeamName: awayTeam?.name || match.awayTeamId,
        utcDate: match.utcDate,
        stage: `Grupo ${group.name}`,
        groupId: group.name,
      });
    }
  }

  const allKnockout = [...R32_MATCHES, ...R16_MATCHES, ...QF_MATCHES, ...SF_MATCHES, ...FINAL_MATCHES];
  const stageLabels: Record<string, string> = {
    R32: "16avos de Final",
    R16: "Octavos de Final",
    QF: "Cuartos de Final",
    SF: "Semifinales",
    Final: "Final",
  };

  for (const m of allKnockout) {
    const details = KNOCKOUT_DETAILS[m.id];
    let stageName = "Final";
    if (R32_MATCHES.includes(m as any)) stageName = "R32";
    else if (R16_MATCHES.includes(m as any)) stageName = "R16";
    else if (QF_MATCHES.includes(m as any)) stageName = "QF";
    else if (SF_MATCHES.includes(m as any)) stageName = "SF";
    else if (m.id === "103") stageName = "3er Puesto";

    map.set(m.id, {
      homeTeamName: (m as any).home || "Por definir",
      awayTeamName: (m as any).away || "Por definir",
      utcDate: details?.utcDate || "",
      stage: stageLabels[stageName] || stageName,
      label: (m as any).label || undefined,
    });
  }
  return map;
})();

function getKnockoutMatchIds(stageKey: string) {
  switch (stageKey) {
    case "R32": return R32_MATCHES.map((m) => m.id);
    case "R16": return R16_MATCHES.map((m) => m.id);
    case "QF": return QF_MATCHES.map((m) => m.id);
    case "SF": return SF_MATCHES.map((m) => m.id);
    case "Final": return FINAL_MATCHES.map((m) => m.id);
    default: return [];
  }
}

// Main resolution function
function resolveTournament(
  predictions: Map<string, PredictionEntry>,
  tournamentGroups: Group[],
  isGroupStageFinished: boolean
) {
  const clonedGroups = JSON.parse(
    JSON.stringify(isGroupStageFinished ? tournamentGroups : INITIAL_GROUPS)
  ) as Group[];

  // Note: We do NOT overlay user predictions on group stage matches anymore.
  // The group stage is finished in reality, so we must use the actual qualified teams.


  const r32Matches = generateR32Matches(clonedGroups);
  const allKnockouts = new Map<string, KnockoutMatch>();

  for (const m of r32Matches) {
    allKnockouts.set(m.id, {
      ...m,
      homeScore: null,
      awayScore: null,
      winner: null
    });
  }

  const remainingDefs = [...R16_MATCHES, ...QF_MATCHES, ...SF_MATCHES, ...FINAL_MATCHES];

  for (const def of remainingDefs) {
    allKnockouts.set(def.id, {
      id: def.id,
      stage: def.id === "103" ? "3rdPlace" : (def.id === "104" ? "Final" : (Number(def.id) >= 101 ? "SF" : (Number(def.id) >= 97 ? "QF" : "R16"))),
      homeTeam: { placeholder: def.home },
      awayTeam: { placeholder: def.away },
      homeScore: null,
      awayScore: null,
      winner: null,
      nextMatchId: def.next || undefined,
      utcDate: def.utcDate,
      location: def.location
    });
  }

  const sortedIds = Array.from(allKnockouts.keys()).sort((a, b) => Number(a) - Number(b));
  const matchResults = new Map<string, { winner: Team | null; loser: Team | null }>();

  for (const id of sortedIds) {
    const match = allKnockouts.get(id)!;

    if (match.homeTeam && "placeholder" in match.homeTeam) {
      const ph = match.homeTeam.placeholder;
      if (ph.startsWith("W") || ph.startsWith("L")) {
        const sourceId = ph.substring(1);
        const sourceRes = matchResults.get(sourceId);
        if (sourceRes) {
          match.homeTeam = ph.startsWith("W") ? sourceRes.winner : sourceRes.loser;
        }
      }
    }

    if (match.awayTeam && "placeholder" in match.awayTeam) {
      const ph = match.awayTeam.placeholder;
      if (ph.startsWith("W") || ph.startsWith("L")) {
        const sourceId = ph.substring(1);
        const sourceRes = matchResults.get(sourceId);
        if (sourceRes) {
          match.awayTeam = ph.startsWith("W") ? sourceRes.winner : sourceRes.loser;
        }
      }
    }

    const pred = predictions.get(id);
    if (pred && pred.homeScore !== "" && pred.awayScore !== "") {
      match.homeScore = Number(pred.homeScore);
      match.awayScore = Number(pred.awayScore);
      match.homePenalties = pred.homePenalties !== undefined && pred.homePenalties !== "" ? Number(pred.homePenalties) : null;
      match.awayPenalties = pred.awayPenalties !== undefined && pred.awayPenalties !== "" ? Number(pred.awayPenalties) : null;

      if (
        match.homeTeam &&
        !("placeholder" in match.homeTeam) &&
        match.awayTeam &&
        !("placeholder" in match.awayTeam)
      ) {
        const hTeam = match.homeTeam as Team;
        const aTeam = match.awayTeam as Team;
        const homeS = Number(pred.homeScore);
        const awayS = Number(pred.awayScore);

        let winner: Team | null = null;
        let loser: Team | null = null;

        if (homeS > awayS) {
          winner = hTeam;
          loser = aTeam;
        } else if (awayS > homeS) {
          winner = aTeam;
          loser = hTeam;
        } else {
          if (pred.homePenalties === 1 && pred.awayPenalties === 0) {
            winner = hTeam;
            loser = aTeam;
          } else if (pred.awayPenalties === 1 && pred.homePenalties === 0) {
            winner = aTeam;
            loser = hTeam;
          } else {
            const rHome = hTeam.ranking || 999;
            const rAway = aTeam.ranking || 999;
            if (rHome < rAway) {
              winner = hTeam;
              loser = aTeam;
            } else {
              winner = aTeam;
              loser = hTeam;
            }
          }
        }
        match.winner = winner;
        matchResults.set(id, { winner, loser });
      }
    }
  }

  return { groups: clonedGroups, knockoutMatches: allKnockouts };
}

export function PredictionComparisonModal({
  isOpen,
  onClose,
  targetUser,
  adminUid,
}: PredictionComparisonModalProps) {
  const [activeTab, setActiveTab] = useState<"groups" | "knockouts">("groups");
  const [selectedSubTab, setSelectedSubTab] = useState<string>("A"); // Group letter or Knockout stage key

  const [userPreds, setUserPreds] = useState<Map<string, PredictionEntry>>(new Map());
  const [adminPreds, setAdminPreds] = useState<Map<string, PredictionEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  // Sync sub-tab selection when main tab changes
  useEffect(() => {
    if (activeTab === "groups") {
      setSelectedSubTab("A");
    } else {
      setSelectedSubTab("R32");
    }
  }, [activeTab]);

  // Load predictions for both users
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const [userRes, adminRes] = await Promise.all([
          fetch(`/api/prode/predictions?uid=${targetUser.firebaseUid}`),
          fetch(`/api/prode/predictions?uid=${adminUid}`),
        ]);

        if (userRes.ok && adminRes.ok) {
          const userJson = await userRes.json();
          const adminJson = await adminRes.json();

          const uMap = new Map<string, PredictionEntry>();
          if (userJson.success && userJson.data) {
            userJson.data.forEach((p: any) => {
              uMap.set(p.matchId, {
                matchId: p.matchId,
                homeScore: p.homeScore,
                awayScore: p.awayScore,
                homePenalties: p.homePenalties ?? "",
                awayPenalties: p.awayPenalties ?? "",
              });
            });
          }

          const aMap = new Map<string, PredictionEntry>();
          if (adminJson.success && adminJson.data) {
            adminJson.data.forEach((p: any) => {
              aMap.set(p.matchId, {
                matchId: p.matchId,
                homeScore: p.homeScore,
                awayScore: p.awayScore,
                homePenalties: p.homePenalties ?? "",
                awayPenalties: p.awayPenalties ?? "",
              });
            });
          }

          setUserPreds(uMap);
          setAdminPreds(aMap);
        }
      } catch (err) {
        console.error("Error fetching comparison data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, targetUser.firebaseUid, adminUid]);

  const { groups: tournamentGroups } = useTournament();
  const isGroupStageFinished = useMemo(() => {
    const allGroupMatches = tournamentGroups.flatMap((g) => g.matches);
    return allGroupMatches.length > 0 && allGroupMatches.every((m) => m.finished);
  }, [tournamentGroups]);

  // Resolve tournament structures
  const userResolved = useMemo(
    () => resolveTournament(userPreds, tournamentGroups, isGroupStageFinished),
    [userPreds, tournamentGroups, isGroupStageFinished]
  );
  const adminResolved = useMemo(
    () => resolveTournament(adminPreds, tournamentGroups, isGroupStageFinished),
    [adminPreds, tournamentGroups, isGroupStageFinished]
  );

  // Pre-calculate statistics
  const stats = useMemo(() => {
    let matchesCount = 0;
    let exactMatches = 0;
    let outcomeMatches = 0;
    let differs = 0;

    userPreds.forEach((uPred, matchId) => {
      const aPred = adminPreds.get(matchId);
      if (!aPred) return;

      const hasUser = uPred.homeScore !== "" && uPred.awayScore !== "";
      const hasAdmin = aPred.homeScore !== "" && aPred.awayScore !== "";

      if (hasUser && hasAdmin) {
        matchesCount++;
        const pts = calculatePoints(
          Number(uPred.homeScore),
          Number(uPred.awayScore),
          Number(aPred.homeScore),
          Number(aPred.awayScore),
          uPred.homePenalties !== "" ? Number(uPred.homePenalties) : undefined,
          uPred.awayPenalties !== "" ? Number(uPred.awayPenalties) : undefined,
          aPred.homePenalties !== "" ? Number(aPred.homePenalties) : undefined,
          aPred.awayPenalties !== "" ? Number(aPred.awayPenalties) : undefined
        );

        if (pts === 3) exactMatches++;
        else if (pts === 1) outcomeMatches++;
        else differs++;
      }
    });

    return {
      matchesCount,
      exactMatches,
      outcomeMatches,
      differs,
      matchPercentage: matchesCount > 0 ? ((exactMatches + outcomeMatches) / matchesCount * 100).toFixed(0) : "0"
    };
  }, [userPreds, adminPreds]);

  // Filter current matches to show
  const currentMatchesData = useMemo(() => {
    if (activeTab === "groups") {
      const groupData = INITIAL_GROUPS.find((g) => g.name === selectedSubTab);
      if (!groupData) return [];
      return groupData.matches.map((m) => {
        const uPred = userPreds.get(m.id);
        const aPred = adminPreds.get(m.id);

        const homeTeam = groupData.teams.find((t) => t.id === m.homeTeamId);
        const awayTeam = groupData.teams.find((t) => t.id === m.awayTeamId);

        return {
          id: m.id,
          utcDate: m.utcDate,
          location: m.location,
          userHomeTeam: homeTeam,
          userAwayTeam: awayTeam,
          adminHomeTeam: homeTeam,
          adminAwayTeam: awayTeam,
          userHomeScore: uPred?.homeScore ?? "",
          userAwayScore: uPred?.awayScore ?? "",
          adminHomeScore: aPred?.homeScore ?? "",
          adminAwayScore: aPred?.awayScore ?? "",
          userHomePen: uPred?.homePenalties ?? "",
          userAwayPen: uPred?.awayPenalties ?? "",
          adminHomePen: aPred?.homePenalties ?? "",
          adminAwayPen: aPred?.awayPenalties ?? "",
        };
      });
    } else {
      const matchIds = getKnockoutMatchIds(selectedSubTab);
      return matchIds.map((id) => {
        const uPred = userPreds.get(id);
        const aPred = adminPreds.get(id);

        const uMatch = userResolved.knockoutMatches.get(id);
        const aMatch = adminResolved.knockoutMatches.get(id);

        const details = KNOCKOUT_DETAILS[id];

        return {
          id,
          utcDate: details?.utcDate || "",
          location: details?.location || "",
          userHomeTeam: uMatch?.homeTeam || null,
          userAwayTeam: uMatch?.awayTeam || null,
          adminHomeTeam: aMatch?.homeTeam || null,
          adminAwayTeam: aMatch?.awayTeam || null,
          userHomeScore: uPred?.homeScore ?? "",
          userAwayScore: uPred?.awayScore ?? "",
          adminHomeScore: aPred?.homeScore ?? "",
          adminAwayScore: aPred?.awayScore ?? "",
          userHomePen: uPred?.homePenalties ?? "",
          userAwayPen: uPred?.awayPenalties ?? "",
          adminHomePen: aPred?.homePenalties ?? "",
          adminAwayPen: aPred?.awayPenalties ?? "",
        };
      });
    }
  }, [activeTab, selectedSubTab, userPreds, adminPreds, userResolved, adminResolved]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Comparar Pronósticos</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparando con <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{targetUser.displayName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Cargando comparación de pronósticos...</p>
              </div>
            ) : (
              <>
                {/* Stats Summary Widget */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3 p-2 border-r border-slate-200 dark:border-slate-800/60 sm:last:border-0">
                    <Award className="w-8 h-8 text-indigo-400" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 dark:text-slate-500 font-bold tracking-wider">Marcador Exacto</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{stats.exactMatches}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 border-r border-slate-200 dark:border-slate-800/60 sm:last:border-0">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 dark:text-slate-500 font-bold tracking-wider">Ganador/Empate</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{stats.outcomeMatches}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 border-r border-slate-200 dark:border-slate-800/60 sm:last:border-0">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 dark:text-slate-500 font-bold tracking-wider">Diferentes</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{stats.differs}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 sm:last:border-0">
                    <Flame className="w-8 h-8 text-cyan-400" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 dark:text-slate-500 font-bold tracking-wider">Coincidencia</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{stats.matchPercentage}%</p>
                    </div>
                  </div>
                </div>

                {/* Compare Users Columns Headers */}
                <div className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  <div className="col-span-5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <span>{targetUser.displayName}</span>
                  </div>
                  <div className="col-span-2 text-slate-400 dark:text-slate-500">vs</div>
                  <div className="col-span-5 text-right flex items-center justify-end gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                    <span>Tus Pronósticos (Admin)</span>
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl">
                  <button
                    onClick={() => setActiveTab("groups")}
                    className={clsx(
                      "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                      activeTab === "groups"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    Fase de Grupos
                  </button>
                  <button
                    onClick={() => setActiveTab("knockouts")}
                    className={clsx(
                      "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                      activeTab === "knockouts"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    Segunda Fase
                  </button>
                </div>

                {/* Subtabs Stage Selection */}
                <div className="overflow-x-auto scrollbar-hide py-1">
                  <div className="flex gap-1.5 min-w-max">
                    {activeTab === "groups"
                      ? GROUP_LABELS.map((g) => (
                          <button
                            key={g}
                            onClick={() => setSelectedSubTab(g)}
                            className={clsx(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              selectedSubTab === g
                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                                : "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                            )}
                          >
                            Grupo {g}
                          </button>
                        ))
                      : KNOCKOUT_STAGES.map((s) => (
                          <button
                            key={s.key}
                            onClick={() => setSelectedSubTab(s.key)}
                            className={clsx(
                              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                              selectedSubTab === s.key
                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                                : "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                  </div>
                </div>

                {/* Match List */}
                <div className="space-y-3">
                  {currentMatchesData.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No hay partidos disponibles en esta etapa.
                    </div>
                  ) : (
                    currentMatchesData.map((m) => {
                      // Calculate points to evaluate matching level
                      const hasUserPred = m.userHomeScore !== "" && m.userAwayScore !== "";
                      const hasAdminPred = m.adminHomeScore !== "" && m.adminAwayScore !== "";

                      let matchStatus: "exact" | "outcome" | "differ" | "pending" = "pending";
                      let matchPoints = 0;

                      if (hasUserPred && hasAdminPred) {
                        matchPoints = calculatePoints(
                          Number(m.userHomeScore),
                          Number(m.userAwayScore),
                          Number(m.adminHomeScore),
                          Number(m.adminAwayScore),
                          m.userHomePen !== "" ? Number(m.userHomePen) : undefined,
                          m.userAwayPen !== "" ? Number(m.userAwayPen) : undefined,
                          m.adminHomePen !== "" ? Number(m.adminHomePen) : undefined,
                          m.adminAwayPen !== "" ? Number(m.adminAwayPen) : undefined
                        );

                        if (matchPoints === 3) matchStatus = "exact";
                        else if (matchPoints === 1) matchStatus = "outcome";
                        else matchStatus = "differ";
                      }

                      // Resolve team names/placeholders
                      const uHomeName = m.userHomeTeam
                        ? ("placeholder" in m.userHomeTeam ? formatPlaceholder(m.userHomeTeam.placeholder) : m.userHomeTeam.name)
                        : "Por definir";
                      const uAwayName = m.userAwayTeam
                        ? ("placeholder" in m.userAwayTeam ? formatPlaceholder(m.userAwayTeam.placeholder) : m.userAwayTeam.name)
                        : "Por definir";

                      const aHomeName = m.adminHomeTeam
                        ? ("placeholder" in m.adminHomeTeam ? formatPlaceholder(m.adminHomeTeam.placeholder) : m.adminHomeTeam.name)
                        : "Por definir";
                      const aAwayName = m.adminAwayTeam
                        ? ("placeholder" in m.adminAwayTeam ? formatPlaceholder(m.adminAwayTeam.placeholder) : m.adminAwayTeam.name)
                        : "Por definir";

                      // For knockout matches, check if predicted teams are different
                      const differentTeams =
                        activeTab === "knockouts" &&
                        ((m.userHomeTeam && "placeholder" in m.userHomeTeam ? m.userHomeTeam.placeholder : m.userHomeTeam?.name) !==
                          (m.adminHomeTeam && "placeholder" in m.adminHomeTeam ? m.adminHomeTeam.placeholder : m.adminHomeTeam?.name) ||
                          (m.userAwayTeam && "placeholder" in m.userAwayTeam ? m.userAwayTeam.placeholder : m.userAwayTeam?.name) !==
                            (m.adminAwayTeam && "placeholder" in m.adminAwayTeam ? m.adminAwayTeam.placeholder : m.adminAwayTeam?.name));

                      return (
                        <div
                          key={m.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-350 dark:hover:border-slate-700 transition-colors shadow-xs"
                        >
                          {/* Top row: Match metadata & comparison tag */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-mono">ID: {m.id}</span>
                            
                            {/* Match comparison status badge */}
                            <div>
                              {matchStatus === "exact" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> Coinciden exactos (+3)
                                </span>
                              )}
                              {matchStatus === "outcome" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600/80 dark:text-emerald-400/80 border border-emerald-500/10">
                                  Coincide resultado (+1)
                                </span>
                              )}
                              {matchStatus === "differ" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Difieren (0)
                                </span>
                              )}
                              {matchStatus === "pending" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Comparison Grid */}
                          <div className="grid grid-cols-12 gap-3 items-center">
                            {/* Target User prediction */}
                            <div className="col-span-5 flex items-center justify-end gap-3 text-right">
                              {/* Team names & flags */}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">{uHomeName}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">{uAwayName}</p>
                              </div>
                              <div className="flex flex-col gap-1 items-end shrink-0">
                                <TeamFlag teamName={uHomeName} className="w-5 h-3.5" />
                                <TeamFlag teamName={uAwayName} className="w-5 h-3.5" />
                              </div>
                              {/* Predicted score box */}
                              <div className="bg-slate-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 min-w-[55px] text-center">
                                {hasUserPred ? (
                                  <div className="font-mono text-sm font-bold text-indigo-650 dark:text-indigo-400 flex flex-col items-center">
                                    <span>{m.userHomeScore} - {m.userAwayScore}</span>
                                    {(m.userHomePen !== "" || m.userAwayPen !== "") && (
                                      <span className="text-[9px] text-indigo-500 dark:text-indigo-500 font-normal">
                                        ({m.userHomePen}-{m.userAwayPen})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-700 text-xs">-</span>
                                )}
                              </div>
                            </div>

                            {/* Center connector VS / Warn icon */}
                            <div className="col-span-2 flex flex-col items-center justify-center text-center">
                              {differentTeams ? (
                                <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20" title="Equipos diferentes en la llave">
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-600 font-extrabold uppercase">VS</span>
                              )}
                              {differentTeams && (
                                <span className="text-[8px] text-amber-600 dark:text-amber-500/80 font-bold mt-1 max-w-[70px] leading-tight block">Cruces dist.</span>
                              )}
                            </div>

                            {/* Admin prediction */}
                            <div className="col-span-5 flex items-center justify-start gap-3 text-left">
                              {/* Predicted score box */}
                              <div className="bg-slate-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 min-w-[55px] text-center">
                                {hasAdminPred ? (
                                  <div className="font-mono text-sm font-bold text-emerald-650 dark:text-emerald-400 flex flex-col items-center">
                                    <span>{m.adminHomeScore} - {m.adminAwayScore}</span>
                                    {(m.adminHomePen !== "" || m.adminAwayPen !== "") && (
                                      <span className="text-[9px] text-emerald-500 dark:text-emerald-500 font-normal">
                                        ({m.adminHomePen}-{m.adminAwayPen})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-700 text-xs">-</span>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 items-start shrink-0">
                                <TeamFlag teamName={aHomeName} className="w-5 h-3.5" />
                                <TeamFlag teamName={aAwayName} className="w-5 h-3.5" />
                              </div>
                              {/* Team names & flags */}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">{aHomeName}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">{aAwayName}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-b-3xl flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
