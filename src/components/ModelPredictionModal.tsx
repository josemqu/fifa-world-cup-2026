"use client";

import { useMemo } from "react";
import { X, TrendingUp, Gauge, Info, HelpCircle } from "lucide-react";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

import { Team } from "@/data/types";
import { AdminSimulationChart } from "@/components/AdminSimulationChart";

interface ExtendedTeam extends Team {
  es_anfitrion?: boolean;
  isHost?: boolean;
  host?: boolean;
}

interface ModelPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  isAdmin?: boolean;
  firebaseUid?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamObj?: ExtendedTeam;
  awayTeamObj?: ExtendedTeam;
  isKnockout: boolean;
  predictionDetails: {
    we: number;
    lambdaA: number;
    lambdaB: number;
    probA: number;
    probX: number;
    probB: number;
    marcadorMasProbable: { golesA: number; golesB: number; prob: number };
    ganadorEsperado: "A" | "B";
    probAvanzaA?: number;
    probAvanzaB?: number;
  };
  userHomeScore: number | "";
  userAwayScore: number | "";
  userHomePenalties?: number | "";
  userAwayPenalties?: number | "";
  modelPrediction?: {
    chance: number;
    ratio: number;
    isExactMatch: boolean;
    isOutcomeMatch: boolean;
  } | null;
  actualStatus?: "scheduled" | "live" | "halftime" | "finished";
  actualElapsed?: number | null;
  actualHomeScore?: number | null;
  actualAwayScore?: number | null;
}

// Helper to compute top 5 exact scores using Poisson PMF
function getTopExactScores(lambdaA: number, lambdaB: number, currentHome: number = 0, currentAway: number = 0) {
  const factorial = (n: number): number => {
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  const poissonPMF = (k: number, lambda: number): number => {
    if (k < 0) return 0;
    if (lambda <= 0) return k === 0 ? 1 : 0;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
  };

  const maxGoals = 5;
  const probsA = Array.from({ length: maxGoals + 1 }, (_, k) => poissonPMF(k, lambdaA));
  const probsB = Array.from({ length: maxGoals + 1 }, (_, k) => poissonPMF(k, lambdaB));

  const sumA = probsA.reduce((sum, v) => sum + v, 0);
  const sumB = probsB.reduce((sum, v) => sum + v, 0);

  const normA = probsA.map((v) => v / (sumA || 1));
  const normB = probsB.map((v) => v / (sumB || 1));

  const scores: { homeGoals: number; awayGoals: number; prob: number }[] = [];
  for (let a = 0; a <= maxGoals; a++) {
    for (let b = 0; b <= maxGoals; b++) {
      scores.push({
        homeGoals: currentHome + a,
        awayGoals: currentAway + b,
        prob: normA[a] * normB[b],
      });
    }
  }

  return scores.sort((a, b) => b.prob - a.prob).slice(0, 5);
}

export function ModelPredictionModal({
  isOpen,
  onClose,
  matchId,
  isAdmin = false,
  firebaseUid,
  homeTeamName,
  awayTeamName,
  homeTeamObj,
  awayTeamObj,
  isKnockout,
  predictionDetails,
  userHomeScore,
  userAwayScore,
  userHomePenalties,
  userAwayPenalties,
  modelPrediction,
  actualStatus,
  actualElapsed,
  actualHomeScore,
  actualAwayScore,
}: ModelPredictionModalProps) {
  const {
    lambdaA,
    lambdaB,
    probA,
    probX,
    probB,
    probAvanzaA = 0.5,
    probAvanzaB = 0.5,
  } = predictionDetails;

  const isLive = actualStatus === "live" || actualStatus === "halftime";
  const isFinished = actualStatus === "finished";

  const topScores = useMemo(() => {
    // For finished matches, we show the pre-match top scores.
    const currentHome = isLive ? (actualHomeScore ?? 0) : 0;
    const currentAway = isLive ? (actualAwayScore ?? 0) : 0;
    return getTopExactScores(lambdaA, lambdaB, currentHome, currentAway);
  }, [lambdaA, lambdaB, isLive, actualHomeScore, actualAwayScore]);

  // Determine user prediction outcome matching status
  const userPredictionText = useMemo(() => {
    if (userHomeScore === "" || userAwayScore === "") return "Sin pronóstico";
    const base = `${userHomeScore} - ${userAwayScore}`;
    if (isKnockout && userHomeScore === userAwayScore) {
      if (userHomePenalties === 1) return `${base} (${homeTeamName} avanza por penales)`;
      if (userAwayPenalties === 1) return `${base} (${awayTeamName} avanza por penales)`;
    }
    return base;
  }, [userHomeScore, userAwayScore, isKnockout, userHomePenalties, userAwayPenalties, homeTeamName, awayTeamName]);

  const closenessBadge = useMemo(() => {
    if (!modelPrediction) return null;
    const { isExactMatch, ratio, chance } = modelPrediction;

    let style = "";
    let label = "";
    let desc = "";

    if (isExactMatch) {
      style = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
      label = "Resultado Modal (100% de cercanía)";
      desc = "Tu pronóstico es el resultado exacto más probable según el modelo.";
    } else if (ratio >= 0.75) {
      style = "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400";
      label = `Muy Probable (${Math.round(ratio * 100)}% de cercanía)`;
      desc = "Muy cercano al marcador más probable.";
    } else if (ratio >= 0.45) {
      style = "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
      label = `Probabilidad Media-Alta (${Math.round(ratio * 100)}% de cercanía)`;
      desc = "El modelo estima una probabilidad razonable para este marcador.";
    } else if (ratio >= 0.20) {
      style = "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
      label = `Probabilidad Moderada (${Math.round(ratio * 100)}% de cercanía)`;
      desc = "Marcador posible, aunque con menor probabilidad que los principales.";
    } else if (ratio >= 0.08) {
      style = "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400";
      label = `Poco Probable (${Math.round(ratio * 100)}% de cercanía)`;
      desc = "Un resultado poco esperado por el modelo.";
    } else {
      style = "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400";
      label = `Muy Improbable (${Math.round(ratio * 100)}% de cercanía)`;
      desc = "Marcador extremadamente alejado de las estimaciones medias.";
    }

    return { style, label, desc, chance };
  }, [modelPrediction]);

  // Model parameters variables
  const pointsA = homeTeamObj?.fifaPoints ?? (2000 - (homeTeamObj?.ranking ?? 50) * 10);
  const pointsB = awayTeamObj?.fifaPoints ?? (2000 - (awayTeamObj?.ranking ?? 50) * 10);
  const esAnfitrionA = homeTeamObj?.name === "México" || homeTeamObj?.name === "Canadá" || homeTeamObj?.name === "Estados Unidos" || !!(homeTeamObj?.es_anfitrion || homeTeamObj?.isHost || homeTeamObj?.host);
  const esAnfitrionB = awayTeamObj?.name === "México" || awayTeamObj?.name === "Canadá" || awayTeamObj?.name === "Estados Unidos" || !!(awayTeamObj?.es_anfitrion || awayTeamObj?.isHost || awayTeamObj?.host);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Detalles del Modelo Matemático</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Predicción Poisson & Fuerza FIFA</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Matchup Header */}
              <div className="flex flex-col items-center gap-2 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-700/40">
                <div className="flex items-center justify-center gap-4 w-full">
                  <div className="flex flex-col items-center gap-1.5 flex-1 text-center min-w-0">
                    <TeamFlag teamName={homeTeamName} className="w-10 h-7 rounded-sm shadow-sm" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">
                      {homeTeamName}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[80px]">
                    {isLive || isFinished ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-base font-extrabold text-slate-850 dark:text-slate-200">
                          {actualHomeScore} - {actualAwayScore}
                        </span>
                        {isLive && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse border border-amber-500/20 uppercase tracking-wide">
                            {actualElapsed ? `En vivo ${actualElapsed}'` : "En vivo"}
                          </span>
                        )}
                        {isFinished && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                            Finalizado
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-650 font-bold text-xs">VS</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1.5 flex-1 text-center min-w-0">
                    <TeamFlag teamName={awayTeamName} className="w-10 h-7 rounded-sm shadow-sm" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">
                      {awayTeamName}
                    </span>
                  </div>
                </div>
              </div>

              {/* User prediction summary */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tu Pronóstico:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">{userPredictionText}</span>
                </div>
                {closenessBadge && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Probabilidad de tendencia:</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-350">{closenessBadge.chance}%</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 text-xs pt-1">
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">Grado de cercanía:</span>
                      <div className="flex flex-col items-end gap-1 text-right">
                        <span className={clsx("px-2 py-0.5 rounded-md text-[10px] font-bold border", closenessBadge.style)}>
                          {closenessBadge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 leading-normal">
                          {closenessBadge.desc}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Outcome Probabilities (1X2) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  {isLive ? "Probabilidad del Resultado Final (En Vivo)" : isFinished ? "Probabilidad del Resultado (Pre-Partido)" : "Probabilidad del Resultado (90 Min)"}
                </h4>
                
                {/* Segmented Progress Bar */}
                <div className="h-6 w-full rounded-lg overflow-hidden flex text-[10px] font-bold text-white shadow-xs">
                  {probA > 0 && (
                    <div
                      style={{ width: `${probA * 100}%` }}
                      className="bg-emerald-500 flex items-center justify-center transition-all min-w-[30px]"
                      title={`Local gana: ${(probA * 100).toFixed(1)}%`}
                    >
                      {Math.round(probA * 100)}%
                    </div>
                  )}
                  {probX > 0 && (
                    <div
                      style={{ width: `${probX * 100}%` }}
                      className="bg-slate-400 dark:bg-slate-600 flex items-center justify-center transition-all min-w-[30px]"
                      title={`Empate: ${(probX * 100).toFixed(1)}%`}
                    >
                      {Math.round(probX * 100)}%
                    </div>
                  )}
                  {probB > 0 && (
                    <div
                      style={{ width: `${probB * 100}%` }}
                      className="bg-indigo-500 flex items-center justify-center transition-all min-w-[30px]"
                      title={`Visitante gana: ${(probB * 100).toFixed(1)}%`}
                    >
                      {Math.round(probB * 100)}%
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-3 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
                    <span>L Gana ({(probA * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="w-2.5 h-2.5 rounded bg-slate-400 dark:bg-slate-600 shrink-0" />
                    <span>Empate ({(probX * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-500 shrink-0" />
                    <span>V Gana ({(probB * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* Knockout Advancement Chance (if applicable) */}
              {isKnockout && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
                    Probabilidad de Clasificar (Incluyendo Penales)
                  </h4>
                  <div className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-slate-700 dark:text-slate-350">{homeTeamName}</span>
                      <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${probAvanzaA * 100}%` }}
                          className="h-full bg-emerald-500 transition-all"
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{(probAvanzaA * 100).toFixed(1)}%</span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-bold text-slate-900 dark:text-white">{(probAvanzaB * 100).toFixed(1)}%</span>
                      <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${probAvanzaB * 100}%` }}
                          className="h-full bg-indigo-500 transition-all"
                        />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-350">{awayTeamName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Model Parameters / Inputs */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Parámetros de Entrada del Modelo
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Home inputs */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/30">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">{homeTeamName}</p>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-550">FIFA Points:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(pointsA)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-550">Localía:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{esAnfitrionA ? "Sí (+0.35 λ)" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-550">{isLive ? "λ (Goles exp. rest.):" : "λ (Goles exp.):"}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{lambdaA.toFixed(3)}</span>
                    </div>
                  </div>

                  {/* Away inputs */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/30">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">{awayTeamName}</p>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-550">FIFA Points:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(pointsB)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-550">Localía:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{esAnfitrionB ? "Sí (+0.35 λ)" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-550">{isLive ? "λ (Goles exp. rest.):" : "λ (Goles exp.):"}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{lambdaB.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400 dark:text-slate-500">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="leading-relaxed">
                    <strong>¿Qué es λ (Lambda)?</strong> Indica la fuerza de ataque media del equipo. Bajo Poisson, se calcula en función de la diferencia de FIFA Points entre equipos y se ajusta por la localía y la forma ofensiva/defensiva actual.
                  </p>
                </div>
              </div>

              {/* Top Exact Scores (Poisson Distribution Heat) */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
                  Marcadores Exactos Más Probables
                </h4>
                <div className="space-y-1.5">
                  {topScores.map((score, index) => {
                    const isUserChoice = score.homeGoals === userHomeScore && score.awayGoals === userAwayScore;
                    return (
                      <div
                        key={index}
                        className={clsx(
                          "flex items-center justify-between p-2 rounded-lg text-xs transition-colors",
                          isUserChoice
                            ? "bg-emerald-500/10 dark:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold"
                            : "bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
                          <span className="font-mono">
                            {score.homeGoals} - {score.awayGoals}
                          </span>
                          {isUserChoice && (
                            <span className="text-[9px] uppercase tracking-wide bg-emerald-500 text-white px-1.5 py-0.5 rounded font-extrabold ml-2">
                              Elegido
                            </span>
                          )}
                        </div>
                        <span className="font-bold font-mono">{(score.prob * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Simulation Chart (Experimental Heatmap & community bubbles) */}
              {isAdmin && firebaseUid && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                  <AdminSimulationChart
                    matchId={matchId}
                    firebaseUid={firebaseUid}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    lambdaA={lambdaA}
                    lambdaB={lambdaB}
                    userHomeScore={userHomeScore}
                    userAwayScore={userAwayScore}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
