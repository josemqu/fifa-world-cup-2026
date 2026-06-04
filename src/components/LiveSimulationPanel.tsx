"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTournament } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { FlashScoreView } from "@/components/ui/FlashScoreView";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";

import {
  Activity,
  Play,
  Square,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Zap,
  CheckCircle,
  Trophy,
  AlertCircle,
  GripHorizontal
} from "lucide-react";

interface LiveMatch {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "halftime" | "finished";
  elapsed: number;
  stage: "group" | "knockout";
  groupId: string;
}

interface GoalAlert {
  id: string;
  team: string;
  matchInfo: string;
  score: string;
}

export function LiveSimulationPanel() {
  const { dbUser, user } = useAuth();
  
  const isDev = process.env.NODE_ENV === "development";
  const isAdmin = dbUser?.role === "admin";
  const isAllowedEmail = 
    user?.email?.toLowerCase().includes("mailjmq") || 
    dbUser?.email?.toLowerCase().includes("mailjmq");

  if (!isDev && !isAdmin && !isAllowedEmail) {
    return null;
  }
  return <RealLiveSimulationPanel />;
}

function RealLiveSimulationPanel() {
  const { resetTournament } = useTournament();
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Sidebar drawer open state
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [goalAlerts, setGoalAlerts] = useState<GoalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [tempTime, setTempTime] = useState("");
  const [hasSimTime, setHasSimTime] = useState(false);

  const prevMatchesRef = useRef<LiveMatch[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial state with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = window.localStorage.getItem("mock_simulation_active") === "true";
      setIsActive(active);
      
      const savedTime = window.localStorage.getItem("simulatedTime");
      if (savedTime) {
        setHasSimTime(true);
        try {
          const date = new Date(savedTime);
          if (!isNaN(date.getTime())) {
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
            setTempTime(localISOTime);
          }
        } catch (e) {}
      }
    }
  }, []);

  const triggerGoalAlert = (scoringTeam: string, match: LiveMatch) => {
    const alertId = `${Date.now()}-${Math.random()}`;
    const newAlert: GoalAlert = {
      id: alertId,
      team: scoringTeam,
      matchInfo: `${match.homeTeamName} vs ${match.awayTeamName}`,
      score: `${match.homeScore} - ${match.awayScore}`
    };
    
    setGoalAlerts(prev => [...prev, newAlert]);
    
    // Auto-remove alert after 4 seconds
    setTimeout(() => {
      setGoalAlerts(prev => prev.filter(a => a.id !== alertId));
    }, 4000);
  };

  const fetchSimulationScores = useCallback(async (actionParam?: string) => {
    try {
      let url = "/api/scores/sync?mock=true";
      if (actionParam) {
        url += `&action=${actionParam}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.scores) {
        const matches: LiveMatch[] = data.scores;
        setLiveMatches(matches);

        // Detect goals
        if (prevMatchesRef.current.length > 0 && !actionParam) {
          matches.forEach(m => {
            const prev = prevMatchesRef.current.find(p => p.matchId === m.matchId);
            if (prev) {
              const homeGoal = prev.homeScore !== null && m.homeScore > prev.homeScore;
              const awayGoal = prev.awayScore !== null && m.awayScore > prev.awayScore;
              
              if (homeGoal) {
                triggerGoalAlert(m.homeTeamName, m);
              } else if (awayGoal) {
                triggerGoalAlert(m.awayTeamName, m);
              }
            }
          });
        }
        prevMatchesRef.current = matches;
      }
    } catch (error) {
      console.error("[LiveSimulationPanel] Error fetching mock scores:", error);
    }
  }, []);

  // Set up polling interval when active
  useEffect(() => {
    if (isActive) {
      fetchSimulationScores();
      intervalRef.current = setInterval(() => {
        fetchSimulationScores();
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setLiveMatches([]);
      prevMatchesRef.current = [];
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, fetchSimulationScores]);

  const handleToggleActive = async () => {
    setLoading(true);
    const nextState = !isActive;
    
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mock_simulation_active", nextState ? "true" : "false");
      window.localStorage.setItem("test_live_scores", nextState ? "true" : "false");
      window.dispatchEvent(new Event("mock_sim_toggle"));
    }
    
    if (nextState) {
      // Start simulation: initialize mock scores
      await fetchSimulationScores("reset");
      setIsActive(true);
    } else {
      // Stop simulation: clear mock scores in DB
      await fetchSimulationScores("clear");
      setIsActive(false);
      resetTournament(); // Reset groups in React state
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    await fetchSimulationScores("reset");
    setLoading(false);
  };

  const handleForceGoal = async () => {
    setLoading(true);
    await fetchSimulationScores("force-goal");
    setLoading(false);
  };

  const handleSaveTime = () => {
    if (tempTime) {
      const date = new Date(tempTime);
      if (!isNaN(date.getTime())) {
        const isoString = date.toISOString();
        window.localStorage.setItem("simulatedTime", isoString);
        setHasSimTime(true);
        window.dispatchEvent(new Event("simulated-time-changed"));
      }
    }
  };

  const handleClearTime = () => {
    window.localStorage.removeItem("simulatedTime");
    setHasSimTime(false);
    setTempTime("");
    window.dispatchEvent(new Event("simulated-time-changed"));
  };

  return (
    <>
      {/* GOAL TOASTS CONTAINER */}
      <div className="fixed bottom-24 right-6 z-[60] flex flex-col-reverse gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {goalAlerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 border border-yellow-400/30 backdrop-blur-md pointer-events-auto"
            >
              <div className="bg-white/20 p-2 rounded-lg shrink-0 animate-bounce">
                <Zap className="w-5 h-5 text-yellow-100 fill-yellow-100" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm tracking-tight uppercase leading-none">
                  ¡GOL DE {alert.team}!
                </h4>
                <p className="text-xs text-yellow-100 mt-1 truncate">
                  {alert.matchInfo}
                </p>
              </div>
              <div className="bg-black/20 px-2.5 py-1 rounded-md font-black text-sm shrink-0">
                {alert.score}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Trigger Handle (hidden when open) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-0 top-1/3 -translate-y-1/2 z-[40] bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-2.5 py-4 rounded-l-xl shadow-xl flex flex-col items-center gap-2 cursor-pointer border border-r-0 border-slate-700/50 dark:border-slate-600/50 hover:bg-blue-600 dark:hover:bg-blue-700 transition-all pointer-events-auto"
            title="Abrir Panel de Simulación"
          >
            <div className="relative flex h-2 w-2 items-center justify-center">
              {isActive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              )}
            </div>
            <Activity className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
              Simulación
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* SIDE MENU DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 pointer-events-auto"
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 max-w-[90vw] z-50 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col pointer-events-auto font-sans"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                    {isActive ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Simulación en Vivo
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {isActive ? "Actualizando (3s)" : "Modo de prueba inactivo"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {/* Scrollable content container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* SIMULATOR SWITCH */}
                <div className="flex flex-col bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/30 gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Modo Simulación de Datos
                    </span>
                    <button
                      onClick={handleToggleActive}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                        isActive ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                    Genera minutos y goles ficticios en la base de datos local para testear marcadores en vivo.
                  </span>
                </div>

                {/* TIME SIMULATOR */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/30 space-y-2.5 animate-fade-in-up">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Simulación de Fecha y Hora
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Fija una fecha y hora global persistente para simular el transcurso del torneo.
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="datetime-local"
                      value={tempTime}
                      onChange={(e) => setTempTime(e.target.value)}
                      className="bg-white dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveTime}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Fijar
                      </button>
                      {hasSimTime && (
                        <button
                          onClick={handleClearTime}
                          className="bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTIVE MATCHES LIST */}
                {isActive && liveMatches.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Activity size={10} className="text-green-500 animate-pulse" />
                      Partidos Simundiales (Grupo A y B)
                    </h4>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-0.5 scrollbar-hide">
                      {liveMatches.map(match => (
                        <div
                          key={match.matchId}
                          className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-sm animate-fade-in-up"
                        >
                          <div className="flex items-center gap-1.5 w-5/12 justify-end min-w-0">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate text-right w-full">
                              {match.homeTeamName}
                            </span>
                            <TeamFlag teamName={match.homeTeamName} className="w-5 h-3.5 shrink-0" />
                          </div>

                          <FlashScoreView
                            homeScore={match.homeScore}
                            awayScore={match.awayScore}
                            className="bg-slate-100 dark:bg-slate-900/60 px-2 py-0.5 rounded text-xs font-extrabold text-slate-900 dark:text-slate-100 shrink-0 text-center min-w-[45px] border border-transparent"
                          />

                          <div className="flex items-center gap-1.5 w-5/12 justify-start min-w-0">
                            <TeamFlag teamName={match.awayTeamName} className="w-5 h-3.5 shrink-0" />
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate w-full">
                              {match.awayTeamName}
                            </span>
                          </div>

                          <div className="text-[9px] font-bold shrink-0 min-w-[28px] text-right">
                            {match.status === "finished" ? (
                              <span className="text-slate-400 dark:text-slate-500 uppercase">Fin</span>
                            ) : match.status === "halftime" ? (
                              <span className="text-amber-500 animate-pulse uppercase">Entretiempo</span>
                            ) : (
                              <span className="text-green-500 dark:text-green-400 animate-pulse">Min {match.elapsed}&apos;</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTION CONTROLS */}
                {isActive && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleForceGoal}
                      disabled={loading || liveMatches.every(m => m.status === "finished")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-3 text-xs font-extrabold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Zap size={13} className="fill-white" />
                      Forzar Gol
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg py-2 px-3 text-xs font-extrabold border border-slate-200/50 dark:border-slate-700/50 transition-colors cursor-pointer"
                      title="Reiniciar partidos a minuto 1"
                    >
                      <RotateCcw size={13} />
                      Reiniciar
                    </button>
                  </div>
                )}

                {/* WARNING DISMISS INFO */}
                {!isActive && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/20">
                    Al desactivar la simulación, los partidos se limpian de la base de datos y el fixture local se restablece para volver a su estado inicial.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
