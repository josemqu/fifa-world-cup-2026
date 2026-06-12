"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Loader2,
  Check,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Lock,
  ChevronDown,
} from "lucide-react";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { clsx } from "clsx";

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

interface RivalPredictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  utcDate: string;
  currentUserUid: string;
}

export function RivalPredictionsModal({
  isOpen,
  onClose,
  matchId,
  homeTeamName,
  awayTeamName,
  utcDate,
  currentUserUid,
}: RivalPredictionsModalProps) {
  const [groups, setGroups] = useState<GroupPredictions[]>([]);
  const [actualScore, setActualScore] = useState<ActualScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/prode/predictions/match?matchId=${matchId}&uid=${currentUserUid}`
        );
        const json = await res.json();
        
        if (res.ok && json.success) {
          setGroups(json.groups || []);
          setActualScore(json.actualScore || null);
          if (json.groups && json.groups.length > 0) {
            const savedGroupId = typeof window !== "undefined" ? localStorage.getItem("prode_rival_active_group_id") : null;
            const exists = json.groups.some((g: any) => g._id === savedGroupId);
            if (savedGroupId && exists) {
              setActiveGroupId(savedGroupId);
            } else {
              setActiveGroupId(json.groups[0]._id);
            }
          }
        } else {
          setError(json.error || "No se pudieron cargar los pronósticos de los rivales.");
        }
      } catch (err) {
        console.error("Error fetching rival predictions:", err);
        setError("Error de conexión al obtener los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, matchId, currentUserUid]);

  if (!isOpen) return null;

  const activeGroup = groups.find((g) => g._id === activeGroupId);
  const matchDate = utcDate ? new Date(utcDate) : null;
  const formattedDate = matchDate
    ? matchDate.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
    : "";
  const formattedTime = matchDate
    ? matchDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-250 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pronósticos de Rivales</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {formattedDate} a las {formattedTime} hs
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Match Info Display */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div className="flex items-center justify-center gap-4 w-full max-w-xs">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center gap-1.5 text-center min-w-0">
                <TeamFlag teamName={homeTeamName} className="w-8 h-5.5 rounded-sm shadow-xs shrink-0" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  {homeTeamName}
                </span>
              </div>

              {/* Score / VS Display */}
              <div className="flex flex-col items-center shrink-0 min-w-[70px]">
                {actualScore ? (
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                      {actualScore.homeScore} - {actualScore.awayScore}
                    </span>
                    {(actualScore.homePenalties !== undefined && actualScore.awayPenalties !== undefined) && (
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                        ({actualScore.homePenalties} - {actualScore.awayPenalties} pen)
                      </span>
                    )}
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mt-0.5">
                      Final
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">VS</span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                      <Lock className="w-2.5 h-2.5" /> Cerrado
                    </span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center gap-1.5 text-center min-w-0">
                <TeamFlag teamName={awayTeamName} className="w-8 h-5.5 rounded-sm shadow-xs shrink-0" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  {awayTeamName}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-5 min-h-[200px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Obteniendo pronósticos del grupo...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-355 max-w-xs">{error}</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-center">
                <Users className="w-9 h-9 text-slate-300 dark:text-slate-650 shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  No pertenecés a ningún grupo de prode para ver los pronósticos de tus rivales. Podés crear o unirte a un grupo desde la pestaña "Mis Grupos".
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Group Dropdown Selector (if multiple groups) */}
                {groups.length > 1 && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <label htmlFor="group-select" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Grupo a mostrar
                    </label>
                    <div className="relative">
                      <select
                        id="group-select"
                        value={activeGroupId || ""}
                        onChange={(e) => {
                          const newGroupId = e.target.value;
                          setActiveGroupId(newGroupId);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("prode_rival_active_group_id", newGroupId);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      >
                        {groups.map((group) => (
                          <option key={group._id} value={group._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {group.name} ({group.members.length} miembros)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Opponents List */}
                {activeGroup && (
                  <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 flex-1 bg-white dark:bg-slate-900/50">
                    {activeGroup.members.map((member) => {
                      const isCurrentUser = member.firebaseUid === currentUserUid;
                      return (
                        <div
                          key={member.firebaseUid}
                          className={clsx(
                            "flex items-center justify-between p-3.5 transition-colors",
                            isCurrentUser
                              ? "bg-blue-50/20 dark:bg-blue-950/10"
                              : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                              <span className="text-xs font-extrabold uppercase">
                                {member.displayName.slice(0, 2)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className={clsx(
                                "text-xs font-semibold truncate",
                                isCurrentUser ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-800 dark:text-slate-200"
                              )}>
                                {member.nickname || member.displayName}
                                {isCurrentUser && (
                                  <span className="ml-1.5 text-[9px] text-blue-500 font-bold bg-blue-500/10 px-1 py-0.5 rounded">
                                    Vos
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Prediction box */}
                            <div className="min-w-[60px] text-center">
                              {member.prediction ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                    {member.prediction.homeScore} - {member.prediction.awayScore}
                                  </span>
                                  {/* Penalties predicted team */}
                                  {member.prediction.homeScore === member.prediction.awayScore &&
                                    (member.prediction.homePenalties !== null &&
                                    member.prediction.awayPenalties !== null) && (
                                      <span className="text-[8px] text-slate-450 dark:text-slate-500 leading-none mt-0.5 truncate max-w-[80px]">
                                        ({member.prediction.homePenalties === 1 ? homeTeamName : awayTeamName})
                                      </span>
                                    )}
                                </div>
                              ) : (
                                <span className="text-slate-350 dark:text-slate-650 text-xs">-</span>
                              )}
                            </div>

                            {/* Points badge if finished */}
                            {member.points !== null && (
                              <div className="min-w-[42px] text-right">
                                {member.points === 3 && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <Zap className="w-2.5 h-2.5" /> +3
                                  </span>
                                )}
                                {member.points === 1 && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    <ShieldCheck className="w-2.5 h-2.5" /> +1
                                  </span>
                                )}
                                {member.points === 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-transparent">
                                    0 pts
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 sticky bottom-0 z-10 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
