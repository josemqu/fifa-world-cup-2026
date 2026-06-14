"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { dbUser, user } = useAuth();
  
  const isAdmin = dbUser?.role === "admin";
  const isAllowedEmail = 
    user?.email?.toLowerCase().includes("mailjmq") || 
    dbUser?.email?.toLowerCase().includes("mailjmq");

  if (!mounted) {
    return null;
  }

  if (!isAdmin && !isAllowedEmail) {
    return null;
  }
  return <RealLiveSimulationPanel dbUser={dbUser} user={user} />;
}

interface RealLiveSimulationPanelProps {
  dbUser: any;
  user: any;
}

function RealLiveSimulationPanel({ dbUser, user }: RealLiveSimulationPanelProps) {
  const { resetTournament, groups, knockoutMatches, updateMatch, updateKnockoutMatch } = useTournament();
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Sidebar drawer open state
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [goalAlerts, setGoalAlerts] = useState<GoalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [tempTime, setTempTime] = useState("");
  const [hasSimTime, setHasSimTime] = useState(false);

  const prevMatchesRef = useRef<LiveMatch[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Overrides State
  const [dbScores, setDbScores] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [overrideHomeScore, setOverrideHomeScore] = useState<string>("");
  const [overrideAwayScore, setOverrideAwayScore] = useState<string>("");
  const [overrideStatus, setOverrideStatus] = useState<string>("scheduled");
  const [overrideElapsed, setOverrideElapsed] = useState<string>("");
  const [isManualOverridden, setIsManualOverridden] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState("");

  const allTournamentMatches = useMemo(() => {
    const list: Array<{ id: string; homeTeamName: string; awayTeamName: string; stage: string }> = [];
    
    // Group stage matches
    for (const group of groups) {
      for (const match of group.matches) {
        const homeTeam = group.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = group.teams.find(t => t.id === match.awayTeamId);
        list.push({
          id: match.id,
          homeTeamName: homeTeam?.name || match.homeTeamId,
          awayTeamName: awayTeam?.name || match.awayTeamId,
          stage: `Grupo ${group.name}`,
        });
      }
    }
    
    // Knockout matches
    for (const match of knockoutMatches) {
      const homeName = match.homeTeam && "placeholder" in match.homeTeam ? match.homeTeam.placeholder : (match.homeTeam?.name || "Por definir");
      const awayName = match.awayTeam && "placeholder" in match.awayTeam ? match.awayTeam.placeholder : (match.awayTeam?.name || "Por definir");
      list.push({
        id: match.id,
        homeTeamName: homeName,
        awayTeamName: awayName,
        stage: match.stage,
      });
    }
    
    return list;
  }, [groups, knockoutMatches]);

  const fetchDbScores = useCallback(async () => {
    try {
      const response = await fetch("/api/scores/sync");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.scores) {
          setDbScores(data.scores);
        }
      }
    } catch (e) {
      console.error("[LiveSimulationPanel] Error fetching DB scores:", e);
    }
  }, []);

  // Fetch DB scores when sidebar is opened
  useEffect(() => {
    if (isOpen) {
      fetchDbScores();
    }
  }, [isOpen, fetchDbScores]);

  // When selectedMatchId changes, populate override form
  useEffect(() => {
    if (selectedMatchId) {
      const match = dbScores.find(s => s.matchId === selectedMatchId);
      if (match) {
        setOverrideHomeScore(match.homeScore !== null ? String(match.homeScore) : "");
        setOverrideAwayScore(match.awayScore !== null ? String(match.awayScore) : "");
        setOverrideStatus(match.status || "scheduled");
        setOverrideElapsed(match.elapsed !== null ? String(match.elapsed) : "");
        setIsManualOverridden(!!match.manualOverride);
      } else {
        setOverrideHomeScore("");
        setOverrideAwayScore("");
        setOverrideStatus("scheduled");
        setOverrideElapsed("");
        setIsManualOverridden(false);
      }
    }
  }, [selectedMatchId, dbScores]);

  const handleSaveOverride = async () => {
    if (!selectedMatchId) return;
    setOverrideLoading(true);
    setOverrideSuccessMsg("");
    try {
      const email = dbUser?.email || user?.email;
      const response = await fetch("/api/scores/override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": email || "",
        },
        body: JSON.stringify({
          matchId: selectedMatchId,
          homeScore: overrideHomeScore === "" ? null : Number(overrideHomeScore),
          awayScore: overrideAwayScore === "" ? null : Number(overrideAwayScore),
          status: overrideStatus,
          elapsed: overrideElapsed === "" ? null : Number(overrideElapsed),
          manualOverride: isManualOverridden,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.score) {
          setOverrideSuccessMsg("¡Partido guardado con éxito!");
          await fetchDbScores(); // Refresh local DB scores
          
          // Propagate change directly to the tournament context in memory
          const match = resData.score;
          if (match.stage === "group" && match.groupId) {
            updateMatch(
              match.groupId,
              match.matchId,
              match.homeScore,
              match.awayScore,
              match.status === "finished"
            );
          } else if (match.stage === "knockout") {
            updateKnockoutMatch(
              match.matchId,
              match.homeScore,
              match.awayScore,
              match.homePenalties,
              match.awayPenalties,
              match.status === "finished"
            );
          }
          
          // Clear message after 3 seconds
          setTimeout(() => {
            setOverrideSuccessMsg("");
          }, 3000);
        } else {
          alert(resData.error || "Error al guardar override");
        }
      } else {
        const err = await response.json();
        alert(err.error || "Error de red al guardar override");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setOverrideLoading(false);
    }
  };

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

  // Listen for global open event from user menu
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-live-simulation", handleOpen);
    return () => window.removeEventListener("open-live-simulation", handleOpen);
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
      
      const headers: Record<string, string> = {};
      const email = dbUser?.email || user?.email;
      if (email) {
        headers["x-admin-email"] = email;
      }
      
      const response = await fetch(url, { headers });
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
      <div className="fixed bottom-[84px] md:bottom-6 right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {goalAlerts.map(alert => (
            <motion.div
              layout
              key={alert.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 15 }}
              exit={{ opacity: 0, y: -50, transition: { type: "tween", duration: 0.15 } }}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 border border-yellow-400/30 backdrop-blur-md pointer-events-auto w-full"
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

                {/* MANUAL SCORE OVERRIDES */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/30 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Corrección Manual de Scores
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Modificá cualquier resultado real y fijalo para que la API externa no lo pise.
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 block mb-1">
                        Seleccionar Partido
                      </label>
                      <select
                        value={selectedMatchId}
                        onChange={(e) => setSelectedMatchId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white"
                      >
                        <option value="">-- Seleccionar --</option>
                        {allTournamentMatches.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.stage}] {m.homeTeamName} vs {m.awayTeamName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedMatchId && (
                      <div className="space-y-2.5 bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/50 animate-fade-in-up">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                              Goles Local
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={overrideHomeScore}
                              onChange={(e) => setOverrideHomeScore(e.target.value)}
                              placeholder="-"
                              className="w-full bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                              Goles Visitante
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={overrideAwayScore}
                              onChange={(e) => setOverrideAwayScore(e.target.value)}
                              placeholder="-"
                              className="w-full bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                              Estado
                            </label>
                            <select
                              value={overrideStatus}
                              onChange={(e) => setOverrideStatus(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="scheduled">Programado</option>
                              <option value="live">En vivo</option>
                              <option value="halftime">Entretiempo</option>
                              <option value="finished">Finalizado</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                              Minuto
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="120"
                              value={overrideElapsed}
                              onChange={(e) => setOverrideElapsed(e.target.value)}
                              placeholder="-"
                              className="w-full bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Fijar resultado (Bypass API)
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsManualOverridden(!isManualOverridden)}
                            className={`relative inline-flex h-4 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isManualOverridden ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isManualOverridden ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveOverride}
                          disabled={overrideLoading}
                          className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-[10px] py-2 rounded-lg shadow-sm transition-colors mt-2 cursor-pointer disabled:opacity-50"
                        >
                          {overrideLoading ? "Guardando..." : "Guardar Corrección"}
                        </button>

                        {overrideSuccessMsg && (
                          <div className="text-[10px] text-green-600 dark:text-green-400 font-bold text-center mt-1 animate-pulse">
                            {overrideSuccessMsg}
                          </div>
                        )}
                      </div>
                    )}
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
                              <span className="text-green-500 dark:text-green-400 animate-pulse">
                                Min {match.elapsed}&apos;{match.elapsed >= 22 && match.elapsed <= 25 && " (CB)"}
                              </span>
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
