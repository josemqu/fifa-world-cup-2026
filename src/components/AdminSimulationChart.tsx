"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Info, Users, TrendingUp, Sparkles, Award } from "lucide-react";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { clsx } from "clsx";
import { getTeamAbbreviation } from "@/utils/teamAbbreviations";

interface MemberPrediction {
  firebaseUid: string;
  displayName: string;
  nickname: string | null;
  prediction: {
    homeScore: number;
    awayScore: number;
    homePenalties: number | null;
    awayPenalties: number | null;
  } | null;
  points: number | null;
}

interface GroupPredictions {
  _id: string;
  name: string;
  code: string;
  members: MemberPrediction[];
}

interface ActualScore {
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
}

interface AdminSimulationChartProps {
  matchId: string;
  firebaseUid: string;
  homeTeamName: string;
  awayTeamName: string;
  lambdaA: number;
  lambdaB: number;
  userHomeScore: number | "";
  userAwayScore: number | "";
}

// Factorial helper
const factorial = (n: number): number => {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
};

// Poisson Probability Mass Function (PMF)
const poissonPMF = (k: number, lambda: number): number => {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

export function AdminSimulationChart({
  matchId,
  firebaseUid,
  homeTeamName,
  awayTeamName,
  lambdaA,
  lambdaB,
  userHomeScore,
  userAwayScore,
}: AdminSimulationChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPredictions, setUserPredictions] = useState<MemberPrediction[]>([]);
  const [actualScore, setActualScore] = useState<ActualScore | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    x: number; // away goals
    y: number; // home goals
    poissonProb: number;
    userCount: number;
    userPct: number;
  } | null>(null);

  // Fetch match predictions
  useEffect(() => {
    if (!matchId || !firebaseUid) return;
    setLoading(true);
    setError(null);

    const fetchPreds = async () => {
      try {
        const res = await fetch(
          `/api/prode/predictions/match?matchId=${matchId}&uid=${firebaseUid}`
        );
        const json = await res.json();

        if (res.ok && json.success) {
          // Find virtual group "Todos los usuarios" (ALL_USERS)
          const allUsersGroup = json.groups?.find(
            (g: GroupPredictions) => g.code === "ALL_USERS" || g._id === "all_users"
          );
          
          if (allUsersGroup) {
            setUserPredictions(allUsersGroup.members || []);
          } else {
            // Fallback: merge members from all groups
            const allMembers: MemberPrediction[] = [];
            const seen = new Set<string>();
            json.groups?.forEach((g: GroupPredictions) => {
              g.members.forEach((m) => {
                if (!seen.has(m.firebaseUid)) {
                  seen.add(m.firebaseUid);
                  allMembers.push(m);
                }
              });
            });
            setUserPredictions(allMembers);
          }
          setActualScore(json.actualScore || null);
        } else {
          setError(json.error || "No se pudieron obtener los pronósticos.");
        }
      } catch (err) {
        console.error("Error loading predictions for chart:", err);
        setError("Error de conexión al cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreds();
  }, [matchId, firebaseUid]);

  // Aggregate user predictions
  const userStats = useMemo(() => {
    // 6x6 grid, values 0..5 (where 5 represents 5 or more goals)
    const counts = Array.from({ length: 6 }, () => Array(6).fill(0));
    let totalCount = 0;

    userPredictions.forEach((member) => {
      if (member.prediction) {
        const h = Math.min(5, member.prediction.homeScore);
        const a = Math.min(5, member.prediction.awayScore);
        counts[a][h] += 1;
        totalCount += 1;
      }
    });

    let maxCount = 0;
    let favScore = { home: 0, away: 0, count: 0 };

    for (let a = 0; a <= 5; a++) {
      for (let h = 0; h <= 5; h++) {
        const c = counts[a][h];
        if (c > maxCount) {
          maxCount = c;
          favScore = { home: h, away: a, count: c };
        }
      }
    }

    return {
      counts,
      totalCount,
      maxCount,
      favScore,
    };
  }, [userPredictions]);

  // Calculate Poisson grid probabilities
  const poissonGrid = useMemo(() => {
    const grid = Array.from({ length: 6 }, () => Array(6).fill(0));
    let maxProb = 0;
    let bestScore = { home: 0, away: 0, prob: 0 };

    // Helper for PMF with "5+" logic
    const getPMF = (k: number, lambda: number) => {
      if (k < 5) return poissonPMF(k, lambda);
      // For 5+, it's 1 - sum of 0..4
      const sum0to4 = 
        poissonPMF(0, lambda) +
        poissonPMF(1, lambda) +
        poissonPMF(2, lambda) +
        poissonPMF(3, lambda) +
        poissonPMF(4, lambda);
      return Math.max(0, 1 - sum0to4);
    };

    for (let a = 0; a <= 5; a++) {
      for (let h = 0; h <= 5; h++) {
        const probH = getPMF(h, lambdaA);
        const probA = getPMF(a, lambdaB);
        const cellProb = probH * probA;
        grid[a][h] = cellProb;

        if (cellProb > maxProb) {
          maxProb = cellProb;
          bestScore = { home: h, away: a, prob: cellProb };
        }
      }
    }

    return {
      grid,
      maxProb,
      bestScore,
    };
  }, [lambdaA, lambdaB]);

  // Compare model and community favorites
  const comparisonText = useMemo(() => {
    if (userStats.totalCount === 0) return "Aún no hay pronósticos de la comunidad.";
    const modelFavStr = `${poissonGrid.bestScore.home} - ${poissonGrid.bestScore.away}`;
    const userFavStr = `${userStats.favScore.home} - ${userStats.favScore.away}`;
    
    if (modelFavStr === userFavStr) {
      return `¡Coincidencia total! Ambos eligen ${modelFavStr} (${Math.round((poissonGrid.bestScore.prob) * 100)}% sim / ${Math.round((userStats.favScore.count / userStats.totalCount) * 100)}% prode).`;
    }
    
    const userPct = Math.round((userStats.favScore.count / userStats.totalCount) * 100);
    const modelPct = Math.round((poissonGrid.bestScore.prob) * 100);
    return `La comunidad prefiere ${userFavStr} (${userPct}%), mientras que el modelo simula ${modelFavStr} (${modelPct}%).`;
  }, [userStats, poissonGrid]);

  if (loading) {
    return (
      <div className="h-[360px] flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-slate-800 p-6">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <span className="text-xs text-slate-400 font-medium">Cargando gráfico experimental y datos de comunidad...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[320px] flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-red-500/20 p-6 text-center">
        <span className="text-sm font-bold text-red-400 mb-2">Error al cargar estadísticas</span>
        <span className="text-xs text-slate-400 max-w-xs">{error}</span>
      </div>
    );
  }

  // Set grid parameters
  const axisLabels = ["0", "1", "2", "3", "4", "5+"];
  
  // Mapping own prediction values (capped at 5)
  const ownH = userHomeScore !== "" ? Math.min(5, userHomeScore) : null;
  const ownA = userAwayScore !== "" ? Math.min(5, userAwayScore) : null;

  // Mapping actual score values (capped at 5)
  const actualH = actualScore ? Math.min(5, actualScore.homeScore) : null;
  const actualA = actualScore ? Math.min(5, actualScore.awayScore) : null;

  return (
    <div className="bg-slate-900/90 dark:bg-slate-950/95 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 text-slate-100 shadow-2xl relative overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Simulación vs. Prode Comunidad
            </h4>
            <p className="text-[9px] text-slate-400">
              Nube de probabilidad Poisson + burbujas de densidad de usuarios
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-850 px-2 py-0.5 rounded border border-slate-800 text-[9px] font-mono text-slate-400 shrink-0 select-none">
          <Users className="w-3.5 h-3.5 text-emerald-400 mr-1" />
          N: {userStats.totalCount}
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex flex-col items-center w-full">
        {/* Row container for vertical Y label and the grid */}
        <div className="flex items-stretch justify-center gap-1.5 w-full max-w-[426px]">
          {/* Y Axis Header (Local) horizontal on the left */}
          <div className="w-20 shrink-0 flex items-center justify-end pr-1 self-stretch">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-750/50 shadow-xs select-none max-w-full" title={homeTeamName}>
              <TeamFlag teamName={homeTeamName} className="w-5 h-3.5 rounded-2xs shadow-md shrink-0" />
              <span className="text-slate-100 font-black whitespace-nowrap">
                {getTeamAbbreviation(homeTeamName)}
              </span>
            </div>
          </div>

          {/* 2D Grid with margins */}
          <div className="flex-1 max-w-[340px] aspect-square flex flex-col gap-1.5 pt-1 relative">
            
            {/* Axis Labels and Grid */}
            <div className="flex-1 grid grid-cols-7 gap-1">
              {/* We map from top to bottom (Y-axis: 5 down to 0) */}
              {Array.from({ length: 6 }, (_, idx) => 5 - idx).map((y) => {
                return (
                  <React.Fragment key={y}>
                    {/* Y-Axis Label */}
                    <div className="flex items-center justify-end pr-2 text-[10px] font-black text-slate-400 select-none">
                      {y === 5 ? "5+" : y}
                    </div>

                    {/* 6 Grid Cells for this row (x = 0..5) */}
                    {Array.from({ length: 6 }, (_, x) => {
                      const poissonProb = poissonGrid.grid[x][y];
                      const userCount = userStats.counts[x][y];
                      const userPct = userStats.totalCount > 0 ? userCount / userStats.totalCount : 0;
                      
                      const isMaxProb = x === poissonGrid.bestScore.away && y === poissonGrid.bestScore.home;
                      
                      // Bubble sizing logic
                      const bubbleSize = userCount > 0
                        ? Math.max(12, Math.min(38, 10 + (userCount / (userStats.maxCount || 1)) * 26))
                        : 0;

                      const isOwnPrediction = ownH !== null && ownA !== null && ownH === y && ownA === x;
                      const isActualResult = actualH !== null && actualA !== null && actualH === y && actualA === x;

                      // Compute background color glow (purple/indigo gradient opacity based on poisson probability)
                      const relProb = poissonProb / (poissonGrid.maxProb || 1);
                      const bgStyle = {
                        background: poissonProb > 0.005 
                          ? `radial-gradient(circle, rgba(139, 92, 246, ${relProb * 0.75}) 0%, rgba(99, 102, 241, ${relProb * 0.35}) 100%)`
                          : "transparent",
                      };

                      return (
                        <div
                          key={x}
                          style={bgStyle}
                          onMouseEnter={() =>
                            setHoveredCell({
                              x,
                              y,
                              poissonProb,
                              userCount,
                              userPct: userPct * 100,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          className={clsx(
                            "aspect-square rounded-lg border border-slate-800/40 relative flex items-center justify-center transition-all duration-150 cursor-pointer select-none hover:border-slate-400 hover:scale-105 active:scale-95 hover:z-10",
                            poissonProb <= 0.005 && "bg-slate-950/20",
                            isMaxProb && "border-indigo-500/20"
                          )}
                        >
                          {/* User Prediction Bubble */}
                          {userCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={{
                                width: `${bubbleSize}px`,
                                height: `${bubbleSize}px`,
                              }}
                              className={clsx(
                                "absolute rounded-full flex items-center justify-center text-white shadow-md z-5 text-[9px] font-black leading-none shrink-0 pointer-events-none select-none",
                                userCount === userStats.maxCount 
                                  ? "bg-gradient-to-br from-cyan-400 to-emerald-500 animate-pulse shadow-cyan-500/30" 
                                  : "bg-gradient-to-br from-emerald-500/90 to-teal-600/90 shadow-emerald-500/20"
                              )}
                              title={`${userCount} usuarios pronosticaron ${y}-${x}`}
                            >
                              {bubbleSize >= 18 && <span>{userCount}</span>}
                            </motion.div>
                          )}

                          {/* Own Prediction marker (Target Ring) */}
                          {isOwnPrediction && (
                            <div 
                              className="absolute inset-0.5 rounded-[5px] border-2 border-dashed border-white/80 z-20 pointer-events-none shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                              title="Tu predicción actual"
                            />
                          )}

                          {/* Actual Score marker (Pulsing Gold Border) */}
                          {isActualResult && (
                            <div 
                              className="absolute inset-0 rounded-lg border-2 border-amber-400 z-20 pointer-events-none animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                              title="Resultado Real Final"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1.5 bg-slate-900 rounded-full" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Bottom-left corner */}
              <div className="flex items-center justify-end pr-2 text-[9px] font-bold text-slate-550 select-none">
                L \ V
              </div>

              {/* X-Axis labels (Away goals) */}
              {axisLabels.map((val) => (
                <div
                  key={val}
                  className="flex items-center justify-center text-[10px] font-black text-slate-400 select-none"
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* X Axis Header (Away) aligned directly under grid */}
        <div className="flex justify-center gap-1.5 w-full max-w-[426px] mt-1.5">
          {/* spacer matching the width of Y Axis Label (w-20) */}
          <div className="w-20 shrink-0" />
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-750/50 shadow-xs select-none" title={awayTeamName}>
              <TeamFlag teamName={awayTeamName} className="w-5 h-3.5 rounded-2xs shadow-md shrink-0" />
              <span className="text-slate-100 font-black whitespace-nowrap">
                {getTeamAbbreviation(awayTeamName)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Focus & Interactive Info Area */}
      <div className="mt-2 min-h-[75px] bg-slate-950/60 rounded-xl p-3 border border-slate-850 flex flex-col justify-center gap-1.5 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {hoveredCell ? (
            <motion.div
              key="cell-hover"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
              className="grid grid-cols-2 gap-2 text-xs"
            >
              <div className="space-y-0.5 border-r border-slate-850 pr-2">
                <div className="flex items-center gap-1 font-bold text-indigo-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Marcador: {hoveredCell.y} - {hoveredCell.x}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Probabilidad Simulación: <strong className="text-slate-200 font-extrabold">{(hoveredCell.poissonProb * 100).toFixed(1)}%</strong>
                </div>
              </div>
              <div className="space-y-0.5 pl-1 flex flex-col justify-center">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Comunidad: <strong className="text-slate-200 font-extrabold">{hoveredCell.userPct.toFixed(1)}%</strong></span>
                </div>
                <div className="text-[9px] text-slate-500">
                  Votos: {hoveredCell.userCount} de {userStats.totalCount} usuarios
                </div>
              </div>

              {/* Status badges inside tooltip */}
              <div className="col-span-2 flex flex-wrap gap-1 mt-1">
                {ownH === hoveredCell.y && ownA === hoveredCell.x && (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[8px] font-bold text-white uppercase tracking-wider">
                    Tu Pronóstico
                  </span>
                )}
                {actualH === hoveredCell.y && actualA === hoveredCell.x && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[8px] font-bold text-amber-400 uppercase tracking-wider">
                    Resultado Real
                  </span>
                )}
                {hoveredCell.y === poissonGrid.bestScore.home && hoveredCell.x === poissonGrid.bestScore.away && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[8px] font-bold text-indigo-400 uppercase tracking-wider">
                    Model peak (Más probable)
                  </span>
                )}
                {userStats.totalCount > 0 && hoveredCell.y === userStats.favScore.home && hoveredCell.x === userStats.favScore.away && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-bold text-emerald-400 uppercase tracking-wider">
                    Comunidad Peak (Favorito)
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="general-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs space-y-1"
            >
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider select-none">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Análisis de Consenso</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-normal font-medium">
                {comparisonText}
              </p>
              <p className="text-[8px] text-slate-500">
                Pasa el cursor o presiona una celda para ver porcentajes exactos.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend Block */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] text-slate-400 border-t border-slate-800/60 pt-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gradient-to-r from-violet-600 to-indigo-600 opacity-60 border border-slate-700" />
          <span>Intensidad de Nube = Simulación Poisson</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
          <span>Burbuja Verde = Predicciones de Comunidad</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border-2 border-dashed border-white" />
          <span>Borde Blanco = Tu Pronóstico</span>
        </div>
        {actualScore && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded border-2 border-amber-400 bg-amber-500/10" />
            <span>Borde Dorado = Resultado Real</span>
          </div>
        )}
      </div>
    </div>
  );
}
