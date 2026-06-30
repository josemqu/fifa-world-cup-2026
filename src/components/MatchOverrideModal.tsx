"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TeamFlag } from "@/components/ui/TeamFlag";

interface MatchOverrideModalProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  finished: boolean;
  stageLabel: string;
  isKnockout: boolean;
  groupId?: string;
  dbScores: any[];
  onClose: () => void;
  onSave: (updatedScore: any) => void;
  dbUser: any;
  user: any;
}

export function MatchOverrideModal({
  matchId,
  homeTeamName,
  awayTeamName,
  homeScore: initialHomeScore,
  awayScore: initialAwayScore,
  homePenalties: initialHomePenalties = null,
  awayPenalties: initialAwayPenalties = null,
  finished: initialFinished,
  stageLabel,
  isKnockout,
  groupId,
  dbScores,
  onClose,
  onSave,
  dbUser,
  user,
}: MatchOverrideModalProps) {
  const [mounted, setMounted] = useState(false);
  const [homeScoreInput, setHomeScoreInput] = useState<string>("");
  const [awayScoreInput, setAwayScoreInput] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);
  const [homePenaltiesInput, setHomePenaltiesInput] = useState<string>("");
  const [awayPenaltiesInput, setAwayPenaltiesInput] = useState<string>("");
  const [status, setStatus] = useState<string>("scheduled");
  const [elapsed, setElapsed] = useState<string>("");
  const [manualOverride, setManualOverride] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showPensTiedWarning, setShowPensTiedWarning] = useState<boolean>(false);

  const showPensInput = isKnockout && homeScoreInput !== "" && awayScoreInput !== "" && Number(homeScoreInput) === Number(awayScoreInput);

  // Reset validation messages when any inputs change
  useEffect(() => {
    setErrorMsg("");
    setShowPensTiedWarning(false);
  }, [homeScoreInput, awayScoreInput, homePenaltiesInput, awayPenaltiesInput]);

  // Load initial values from dbScores if available, else from props
  useEffect(() => {
    const dbScore = dbScores.find((s) => s.matchId === matchId);
    if (dbScore) {
      setHomeScoreInput(dbScore.homeScore !== null && dbScore.homeScore !== undefined ? String(dbScore.homeScore) : "");
      setAwayScoreInput(dbScore.awayScore !== null && dbScore.awayScore !== undefined ? String(dbScore.awayScore) : "");
      setHomePenaltiesInput(dbScore.homePenalties !== null && dbScore.homePenalties !== undefined ? String(dbScore.homePenalties) : "");
      setAwayPenaltiesInput(dbScore.awayPenalties !== null && dbScore.awayPenalties !== undefined ? String(dbScore.awayPenalties) : "");
      setStatus(dbScore.status || "scheduled");
      setElapsed(dbScore.elapsed !== null && dbScore.elapsed !== undefined ? String(dbScore.elapsed) : "");
      setManualOverride(dbScore.manualOverride !== false);
    } else {
      setHomeScoreInput(initialHomeScore !== null && initialHomeScore !== undefined ? String(initialHomeScore) : "");
      setAwayScoreInput(initialAwayScore !== null && initialAwayScore !== undefined ? String(initialAwayScore) : "");
      setHomePenaltiesInput(initialHomePenalties !== null && initialHomePenalties !== undefined ? String(initialHomePenalties) : "");
      setAwayPenaltiesInput(initialAwayPenalties !== null && initialAwayPenalties !== undefined ? String(initialAwayPenalties) : "");
      setStatus(initialFinished ? "finished" : "scheduled");
      setElapsed("");
      setManualOverride(true);
    }
  }, [matchId, dbScores, initialHomeScore, initialAwayScore, initialHomePenalties, initialAwayPenalties, initialFinished]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (showPensInput) {
      if (status === "finished" && (homePenaltiesInput === "" || awayPenaltiesInput === "")) {
        setErrorMsg("Debe ingresar el resultado de la tanda de penales para finalizar el partido.");
        setLoading(false);
        return;
      }
      if (homePenaltiesInput !== "" && awayPenaltiesInput !== "" && Number(homePenaltiesInput) === Number(awayPenaltiesInput)) {
        setShowPensTiedWarning(true);
        setLoading(false);
        return;
      }
    }

    try {
      const email = dbUser?.email || user?.email;
      const response = await fetch("/api/scores/override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": email || "",
        },
        body: JSON.stringify({
          matchId,
          homeScore: homeScoreInput === "" ? null : Number(homeScoreInput),
          awayScore: awayScoreInput === "" ? null : Number(awayScoreInput),
          homePenalties: showPensInput ? (homePenaltiesInput === "" ? null : Number(homePenaltiesInput)) : null,
          awayPenalties: showPensInput ? (awayPenaltiesInput === "" ? null : Number(awayPenaltiesInput)) : null,
          status,
          elapsed: status === "live" && elapsed !== "" ? Number(elapsed) : null,
          manualOverride,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        onSave(resData.score);
      } else {
        setErrorMsg(resData.error || "Error al guardar la corrección.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error de red al intentar guardar.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Corrección Manual
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Partido ID: {matchId} · {stageLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Match Teams representation */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-1.5 w-5/12 text-center">
              <TeamFlag teamName={homeTeamName} className="w-10 h-7 rounded shadow-sm object-cover" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                {homeTeamName}
              </span>
            </div>

            {/* VS Divider */}
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              VS
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-1.5 w-5/12 text-center">
              <TeamFlag teamName={awayTeamName} className="w-10 h-7 rounded shadow-sm object-cover" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                {awayTeamName}
              </span>
            </div>
          </div>

          {/* Scores Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Goles Local
              </label>
              <input
                type="number"
                min="0"
                value={homeScoreInput}
                onChange={(e) => setHomeScoreInput(e.target.value)}
                placeholder="-"
                className="w-full text-center text-sm font-extrabold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Goles Visitante
              </label>
              <input
                type="number"
                min="0"
                value={awayScoreInput}
                onChange={(e) => setAwayScoreInput(e.target.value)}
                placeholder="-"
                className="w-full text-center text-sm font-extrabold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Penalties Inputs (Knockout Draw only) */}
          {showPensInput && (
            <div className="grid grid-cols-2 gap-4 bg-amber-50/40 dark:bg-amber-950/10 p-3.5 rounded-xl border border-amber-100/50 dark:border-amber-900/20 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                  Penales Local
                </label>
                <input
                  type="number"
                  min="0"
                  value={homePenaltiesInput}
                  onChange={(e) => setHomePenaltiesInput(e.target.value)}
                  placeholder="-"
                  className="w-full text-center text-sm font-extrabold bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-amber-700 dark:text-amber-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                  Penales Visitante
                </label>
                <input
                  type="number"
                  min="0"
                  value={awayPenaltiesInput}
                  onChange={(e) => setAwayPenaltiesInput(e.target.value)}
                  placeholder="-"
                  className="w-full text-center text-sm font-extrabold bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-amber-700 dark:text-amber-300"
                />
              </div>
            </div>
          )}

          {/* Status & Elapsed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="scheduled">Programado</option>
                <option value="live">En vivo</option>
                <option value="halftime">Entretiempo</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Minuto
              </label>
              <input
                type="number"
                min="0"
                max="135"
                disabled={status !== "live"}
                value={status === "live" ? elapsed : ""}
                onChange={(e) => setElapsed(e.target.value)}
                placeholder={status === "live" ? "Minuto" : "N/A"}
                className="w-full text-center text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Bypass Toggle */}
          <div className="bg-blue-50/40 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/20 flex items-start gap-3">
            <input
              type="checkbox"
              id="manualOverride"
              checked={manualOverride}
              onChange={(e) => setManualOverride(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
              <label htmlFor="manualOverride" className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none cursor-pointer">
                Activar Bypass de API
              </label>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                Cuando está activo, el sistema de sincronización automática ignorará las actualizaciones externas para este partido.
              </p>
            </div>
          </div>

          {/* Warning Message for tied penalties */}
          {showPensTiedWarning && (
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-3 py-2 rounded-lg mb-3">
              ⚠️ Los penales no pueden quedar empatados. Uno de los dos debe ganar la tanda.
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-3 py-2 rounded-lg">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-850 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
