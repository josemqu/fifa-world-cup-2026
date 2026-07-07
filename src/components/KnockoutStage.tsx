import { Group, KnockoutMatch, Team } from "@/data/types";
import {
  getGroupStandings,
  getSortedThirdPlaceTeams,
  getPlaceholderExplanation,
} from "@/utils/knockoutUtils";
import { predictMatchScore } from "@/utils/simulationUtils";
import { clsx } from "clsx";
import { Tooltip } from "@/components/ui/Tooltip";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { Info, Trash2, Play, RotateCcw, Edit2, RefreshCw } from "lucide-react";
import { useTournament } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";
import { useMatchTime } from "@/hooks/useMatchTime";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MatchOverrideModal } from "@/components/MatchOverrideModal";
import { AnimatePresence } from "framer-motion";
import {
  FloatingContainer,
  FloatingButton,
} from "@/components/ui/FloatingActions";
import { MatchDateTime } from "@/components/ui/MatchDateTime";
import { FlashScoreInput } from "@/components/ui/FlashScoreInput";


interface KnockoutStageProps {
  groups: Group[];
  matches: KnockoutMatch[];
  onMatchUpdate: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
    homeScorers?: any[],
    awayScorers?: any[],
  ) => void;
}

// Helper component for Champion Banner
function ChampionBanner({
  champion,
  isSticky = false,
}: {
  champion: Team;
  isSticky?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center animate-bounce-subtle z-50",
        isSticky ? "pointer-events-auto" : "mb-6",
      )}
    >
      <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1 shadow-sm">
        Campeón
      </span>
      <div className="bg-linear-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/80 dark:to-yellow-800/80 border-2 border-yellow-400 text-yellow-900 dark:text-yellow-100 px-6 py-3 rounded-xl font-black shadow-[0_0_15px_rgba(250,204,21,0.5)] flex items-center gap-3 text-lg backdrop-blur-sm">
        <TeamFlag teamName={champion.name} className="w-8 h-6 shadow-sm" />
        {champion.name}
      </div>
    </div>
  );
}

// Helper component for candidates tooltip
export function CandidatesTooltip({
  candidates,
}: {
  candidates: { team: Team; probability: number }[];
}) {
  const sorted = [...candidates].sort((a, b) => b.probability - a.probability);
  const limit = 5;
  const topCandidates = sorted.slice(0, limit);
  const remaining = sorted.length - limit;

  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      <span className="font-bold text-xs border-b border-slate-700/50 pb-1 mb-1">
        Candidatos Posibles
      </span>
      <div className="grid grid-cols-1 gap-y-1">
        {topCandidates.map((c) => (
          <div
            key={c.team.id}
            className="flex justify-between items-center text-[10px]"
          >
            <span className="truncate max-w-[130px] block">
              {c.team.name} ({c.team.group})
            </span>
            <span className="font-mono text-slate-400 ml-2 shrink-0">
              {c.probability * 100 < 0.5 && c.probability > 0
                ? "~0%"
                : `${(c.probability * 100).toFixed(0)}%`}
            </span>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div className="text-[10px] text-slate-400 italic pt-1 text-center border-t border-slate-700/30 mt-1">
          + {remaining} equipos más
        </div>
      )}
    </div>
  );
}

// Helper to render a match card
function MatchCard({
  match,
  roundName,
  onUpdate,
  onSimulate,
  onReset,
  tooltipPlacement = "top",
}: {
  match: KnockoutMatch;
  roundName: string;
  onUpdate: (
    id: string,
    h: number | null,
    a: number | null,
    hp?: number | null,
    ap?: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
    homeScorers?: any[],
    awayScorers?: any[],
  ) => void;
  onSimulate?: (match: KnockoutMatch) => void;
  onReset?: (match: KnockoutMatch) => void;
  tooltipPlacement?: "top" | "right" | "bottom" | "left";
}) {
  const { dbUser, user } = useAuth();
  const [dbScores, setDbScores] = useState<any[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSyncMatch = async () => {
    setIsSyncing(true);
    try {
      const email = dbUser?.email || user?.email;
      const response = await fetch("/api/scores/sync-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": email || "",
        },
        body: JSON.stringify({ matchId: match.id }),
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.score) {
        const updatedScore = resData.score;
        setDbScores((prev) => {
          const existingIdx = prev.findIndex((s) => s.matchId === updatedScore.matchId);
          if (existingIdx !== -1) {
            const copy = [...prev];
            copy[existingIdx] = updatedScore;
            return copy;
          } else {
            return [...prev, updatedScore];
          }
        });

        onUpdate(
          updatedScore.matchId,
          updatedScore.homeScore,
          updatedScore.awayScore,
          updatedScore.homePenalties,
          updatedScore.awayPenalties,
          updatedScore.status === "finished",
          updatedScore.status,
          updatedScore.elapsed,
          updatedScore.homeScorers,
          updatedScore.awayScorers
        );
      } else {
        alert(resData.error || "Error al sincronizar el partido.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error de red al intentar sincronizar.");
    } finally {
      setIsSyncing(false);
    }
  };

  const isAdmin = useMemo(() => {
    return dbUser?.role === "admin" ||
      !!user?.email?.toLowerCase().includes("mailjmq") ||
      !!dbUser?.email?.toLowerCase().includes("mailjmq");
  }, [dbUser, user]);

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
      console.error("[MatchCard] Error fetching DB scores:", e);
    }
  }, []);

  useEffect(() => {
    if (showOverrideModal) {
      fetchDbScores();
    }
  }, [showOverrideModal, fetchDbScores]);

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const prob = match.probabilisticData;

  const isHomeProjected =
    (!homeTeam || "placeholder" in homeTeam) && !!prob?.projectedHomeTeam;
  const isAwayProjected =
    (!awayTeam || "placeholder" in awayTeam) && !!prob?.projectedAwayTeam;

  const displayedHome = homeTeam;
  const displayedAway = awayTeam;

  const homeName =
    displayedHome && "placeholder" in displayedHome
      ? displayedHome.placeholder
      : displayedHome?.name;
  const awayName =
    displayedAway && "placeholder" in displayedAway
      ? displayedAway.placeholder
      : displayedAway?.name;

  const homeProb = prob?.homeTeamProb;
  const awayProb = prob?.awayTeamProb;
  const showProbabilities = homeProb !== undefined && awayProb !== undefined;

  const isHomePlaceholder =
    !displayedHome || "placeholder" in displayedHome || isHomeProjected;
  const isAwayPlaceholder =
    !displayedAway || "placeholder" in displayedAway || isAwayProjected;

  const isMatchupDetermined = !isHomePlaceholder && !isAwayPlaceholder;

  // Determine favorite for determined matches to show visual cue
  const homeIsFavorite =
    isMatchupDetermined &&
    showProbabilities &&
    homeProb !== undefined &&
    awayProb !== undefined &&
    homeProb > awayProb;
  const awayIsFavorite =
    isMatchupDetermined &&
    showProbabilities &&
    homeProb !== undefined &&
    awayProb !== undefined &&
    awayProb > homeProb;
  const isStarted = new Date() >= new Date(match.utcDate);
  const canEdit =
    !isHomePlaceholder &&
    !isAwayPlaceholder &&
    !isHomeProjected &&
    !isAwayProjected &&
    !isStarted;

  // Check for tie
  const isTied =
    match.homeScore !== null &&
    match.homeScore !== undefined &&
    match.awayScore !== null &&
    match.awayScore !== undefined &&
    match.homeScore === match.awayScore;

  // Check for penalty tie (Invalid state)
  const isPenaltyTied =
    isTied &&
    match.homePenalties !== null &&
    match.homePenalties !== undefined &&
    match.awayPenalties !== null &&
    match.awayPenalties !== undefined &&
    match.homePenalties === match.awayPenalties;

  const hasResult = match.homeScore !== null && match.awayScore !== null;
  const showTeamProbabilities = !hasResult;

  return (
    <div
      className={clsx(
        "bg-white dark:bg-slate-800 border rounded-lg shadow-sm min-w-[160px] relative z-10 transition-colors flex flex-col",
        isPenaltyTied
          ? "border-red-300 dark:border-red-900/50"
          : "border-slate-200 dark:border-slate-700",
      )}
    >
      {/* Header Section: Stage & Date (Schedule Style) */}
      <div className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 px-3 flex justify-between items-center rounded-t-lg h-9">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            #{match.id}
          </span>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSyncMatch}
                disabled={isSyncing}
                className="p-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center justify-center border border-slate-300/40 dark:border-slate-600/35"
                title="Forzar sincronización de API"
              >
                <RefreshCw size={8} className={isSyncing ? "animate-spin text-green-600 dark:text-green-400" : ""} />
              </button>
              <button
                type="button"
                onClick={() => setShowOverrideModal(true)}
                className="p-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer inline-flex items-center justify-center border border-slate-300/40 dark:border-slate-600/35"
                title="Corregir score manualmente"
              >
                <Edit2 size={8} />
              </button>
            </div>
          )}
        </div>
        <MatchDateTime
          utcDate={match.utcDate}
          matchId={match.id}
          dateClassName="text-[10px] font-medium text-slate-400 dark:text-slate-500"
          timeClassName="text-[10px] font-bold text-slate-600 dark:text-slate-300"
        />
      </div>

      <div className="p-3">
        {isPenaltyTied && (
          <Tooltip content="Los penales no pueden quedar empatados" placement="top">
            <div
              className="absolute top-10 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm z-20"
            >
              !
            </div>
          </Tooltip>
        )}
        <div className="flex flex-col gap-1.5">
          {/* Home Team */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <TeamFlag
                  teamName={homeName || ""}
                  className="w-4 h-3 shrink-0"
                />
                <Tooltip
                  content={
                    isHomePlaceholder && !isHomeProjected && homeName
                      ? getPlaceholderExplanation(homeName)
                      : homeName
                  }
                  placement="top"
                  wrapperClassName="min-w-0 flex-1"
                  onlyShowIfTruncated={!(isHomePlaceholder && !isHomeProjected && homeName) || getPlaceholderExplanation(homeName) === homeName}
                >
                  <span
                    className={clsx(
                      "font-medium text-xs truncate block",
                      isHomePlaceholder
                        ? "text-slate-400 italic"
                        : "text-slate-900 dark:text-slate-100",
                      isHomeProjected && "text-blue-600 dark:text-blue-400",
                      homeIsFavorite &&
                      "font-bold text-indigo-700 dark:text-indigo-300",
                    )}
                  >
                    {homeName}
                  </span>
                </Tooltip>
                {isHomeProjected && (
                  <Tooltip
                    placement={tooltipPlacement}
                    content={
                      <CandidatesTooltip
                        candidates={prob?.homeCandidates || []}
                      />
                    }
                  >
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 cursor-help" />
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isStarted ? (
                <>
                  {isTied && match.homePenalties !== null && match.homePenalties !== undefined && (
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      ({match.homePenalties})
                    </span>
                  )}
                  <FlashScoreInput
                    type="number"
                    className="w-7 h-7 text-center text-xs font-bold bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 rounded outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-default pointer-events-none"
                    value={match.homeScore ?? "-"}
                    readOnly
                  />
                </>
              ) : (
                <>
                  {isTied && (
                    <FlashScoreInput
                      type="number"
                      min="0"
                      className={clsx(
                        "w-5 h-5 text-center text-[10px] font-medium border rounded focus:ring-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50",
                        isPenaltyTied
                          ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-600 focus:ring-red-500 focus:border-red-500"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent",
                      )}
                      value={match.homePenalties ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? null : parseInt(e.target.value);
                        onUpdate(
                          match.id,
                          match.homeScore ?? null,
                          match.awayScore ?? null,
                          val,
                          match.awayPenalties ?? null,
                        );
                      }}
                      placeholder="P"
                      disabled={!canEdit}
                    />
                  )}
                  <FlashScoreInput
                    type="number"
                    min="0"
                    className="w-7 h-7 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                    value={match.homeScore ?? ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? null : parseInt(e.target.value);
                      onUpdate(
                        match.id,
                        val,
                        match.awayScore ?? null,
                        match.homePenalties ?? null,
                        match.awayPenalties ?? null,
                      );
                    }}
                    placeholder="-"
                    disabled={!canEdit}
                  />
                </>
              )}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <TeamFlag
                  teamName={awayName || ""}
                  className="w-4 h-3 shrink-0"
                  showPlaceholder={false}
                />
                <Tooltip
                  content={
                    isAwayPlaceholder && !isAwayProjected && awayName
                      ? getPlaceholderExplanation(awayName)
                      : awayName
                  }
                  placement="top"
                  wrapperClassName="min-w-0 flex-1"
                  onlyShowIfTruncated={!(isAwayPlaceholder && !isAwayProjected && awayName) || getPlaceholderExplanation(awayName) === awayName}
                >
                  <span
                    className={clsx(
                      "font-medium text-xs truncate block",
                      isAwayPlaceholder
                        ? "text-slate-400 italic"
                        : "text-slate-900 dark:text-slate-100",
                      isAwayProjected && "text-blue-600 dark:text-blue-400",
                      awayIsFavorite &&
                      "font-bold text-indigo-700 dark:text-indigo-300",
                    )}
                  >
                    {awayName}
                  </span>
                </Tooltip>
                {isAwayProjected && (
                  <Tooltip
                    placement={tooltipPlacement}
                    content={
                      <CandidatesTooltip
                        candidates={prob?.awayCandidates || []}
                      />
                    }
                  >
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 cursor-help" />
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isStarted ? (
                <>
                  {isTied && match.awayPenalties !== null && match.awayPenalties !== undefined && (
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      ({match.awayPenalties})
                    </span>
                  )}
                  <FlashScoreInput
                    type="number"
                    className="w-7 h-7 text-center text-xs font-bold bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 rounded outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-default pointer-events-none"
                    value={match.awayScore ?? "-"}
                    readOnly
                  />
                </>
              ) : (
                <>
                  {isTied && (
                    <FlashScoreInput
                      type="number"
                      min="0"
                      className={clsx(
                        "w-5 h-5 text-center text-[10px] font-medium border rounded focus:ring-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50",
                        isPenaltyTied
                          ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-600 focus:ring-red-500 focus:border-red-500"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent",
                      )}
                      value={match.awayPenalties ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? null : parseInt(e.target.value);
                        onUpdate(
                          match.id,
                          match.homeScore ?? null,
                          match.awayScore ?? null,
                          match.homePenalties ?? null,
                          val,
                        );
                      }}
                      placeholder="P"
                      disabled={!canEdit}
                    />
                  )}
                  <FlashScoreInput
                    type="number"
                    min="0"
                    className="w-7 h-7 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                    value={match.awayScore ?? ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? null : parseInt(e.target.value);
                      onUpdate(
                        match.id,
                        match.homeScore ?? null,
                        val,
                        match.homePenalties ?? null,
                        match.awayPenalties ?? null,
                      );
                    }}
                    placeholder="-"
                    disabled={!canEdit}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section: Probability & Controls */}
      <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 px-3 flex justify-between items-center mt-auto rounded-b-lg h-9 gap-2">
        {/* Stadium & Location */}
        {match.location ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Tooltip
              content={match.location}
              placement="bottom"
              wrapperClassName="min-w-0 flex-1"
            >
              <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate block cursor-help">
                📍 {match.location.split(" - ")[0]}
                {match.location.includes(" - ") && (
                  <span className="text-slate-300 dark:text-slate-600">
                    {" — "}
                    {match.location.split(" - ")[1]}
                  </span>
                )}
              </span>
            </Tooltip>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            {hasResult && (
              <Tooltip content="Resetear resultado" placement="top">
                <button
                  onClick={() => onReset?.(match)}
                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
            <Tooltip content="Simular este partido" placement="top">
              <button
                onClick={() => onSimulate?.(match)}
                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current opacity-80" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showOverrideModal && (
          <MatchOverrideModal
            matchId={match.id}
            homeTeamName={homeName || "Por definir"}
            awayTeamName={awayName || "Por definir"}
            homeScore={match.homeScore ?? null}
            awayScore={match.awayScore ?? null}
            homePenalties={match.homePenalties ?? null}
            awayPenalties={match.awayPenalties ?? null}
            finished={!!match.finished}
            stageLabel={roundName}
            isKnockout={true}
            dbScores={dbScores}
            onClose={() => setShowOverrideModal(false)}
            onSave={(updatedScore: any) => {
              setDbScores((prev) => {
                const existingIdx = prev.findIndex((s) => s.matchId === updatedScore.matchId);
                if (existingIdx !== -1) {
                  const copy = [...prev];
                  copy[existingIdx] = updatedScore;
                  return copy;
                } else {
                  return [...prev, updatedScore];
                }
              });
              onUpdate(
                updatedScore.matchId,
                updatedScore.homeScore,
                updatedScore.awayScore,
                updatedScore.homePenalties,
                updatedScore.awayPenalties,
                updatedScore.status === "finished",
                updatedScore.status,
                updatedScore.elapsed
              );
              setShowOverrideModal(false);
            }}
            dbUser={dbUser}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to render a pair of matches with a connector
function MatchPair({
  match1,
  match2,
  roundName,
  onUpdate,
  onSimulate,
  onReset,
  tooltipPlacement,
}: {
  match1: KnockoutMatch;
  match2: KnockoutMatch;
  roundName: string;
  onUpdate: (
    id: string,
    h: number | null,
    a: number | null,
    hp?: number | null,
    ap?: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
  ) => void;
  onSimulate?: (match: KnockoutMatch) => void;
  onReset?: (match: KnockoutMatch) => void;
  tooltipPlacement?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <div className="flex flex-col justify-around h-full relative mb-4">
      <MatchCard
        match={match1}
        roundName={roundName}
        onUpdate={onUpdate}
        onSimulate={onSimulate}
        onReset={onReset}
        tooltipPlacement={tooltipPlacement}
      />
      <MatchCard
        match={match2}
        roundName={roundName}
        onUpdate={onUpdate}
        onSimulate={onSimulate}
        onReset={onReset}
        tooltipPlacement={tooltipPlacement}
      />

      {/* Connector Bracket */}
      <div className="absolute right-0 top-1/4 bottom-1/4 w-4 translate-x-full pointer-events-none">
        {/* Vertical Line and Horizontal Arms */}
        <div className="absolute inset-0 border-r-2 border-y-2 border-slate-300 dark:border-slate-600 rounded-r-lg" />
        {/* Horizontal Tail to next round */}
        <div className="absolute top-1/2 right-0 w-4 h-[2px] bg-slate-300 dark:bg-slate-600 translate-x-full transform -translate-y-1/2" />
      </div>
    </div>
  );
}

const STAGES = [
  {
    id: "r32",
    label: "16avos de Final",
    colStart: 1,
    bgClass: "bg-blue-50/50 dark:bg-blue-900/10",
    headerClass:
      "bg-blue-100/95 dark:bg-blue-900/90 text-blue-700 dark:text-blue-300",
  },
  {
    id: "r16",
    label: "Octavos de Final",
    colStart: 2,
    bgClass: "bg-indigo-50/50 dark:bg-indigo-900/10",
    headerClass:
      "bg-indigo-100/95 dark:bg-indigo-900/90 text-indigo-700 dark:text-indigo-300",
  },
  {
    id: "qf",
    label: "Cuartos de Final",
    colStart: 3,
    bgClass: "bg-violet-50/50 dark:bg-violet-900/10",
    headerClass:
      "bg-violet-100/95 dark:bg-violet-900/90 text-violet-700 dark:text-violet-300",
  },
  {
    id: "sf",
    label: "Semifinales",
    colStart: 4,
    bgClass: "bg-purple-50/50 dark:bg-purple-900/10",
    headerClass:
      "bg-purple-100/95 dark:bg-purple-900/90 text-purple-700 dark:text-purple-300",
  },
  {
    id: "f",
    label: "Finales",
    colStart: 5,
    bgClass: "bg-fuchsia-50/50 dark:bg-fuchsia-900/10",
    headerClass:
      "bg-fuchsia-100/95 dark:bg-fuchsia-900/90 text-fuchsia-700 dark:text-fuchsia-300",
  },
] as const;

export function KnockoutStage({
  groups,
  matches,
  onMatchUpdate,
}: KnockoutStageProps) {
  const { dbUser, user } = useAuth();
  const { simulateKnockout, simulateAll, resetTournament } = useTournament();

  const isAdmin = useMemo(() => {
    return dbUser?.role === "admin" ||
      !!user?.email?.toLowerCase().includes("mailjmq") ||
      !!dbUser?.email?.toLowerCase().includes("mailjmq");
  }, [dbUser, user]);


  // Helper to chunk matches into pairs
  const pairMatches = (matchList: KnockoutMatch[]) => {
    const pairs = [];
    for (let i = 0; i < matchList.length; i += 2) {
      pairs.push({ m1: matchList[i], m2: matchList[i + 1] });
    }
    return pairs;
  };

  const handleSimulateMatch = (match: KnockoutMatch) => {
    if (
      match.homeTeam &&
      !("placeholder" in match.homeTeam) &&
      match.awayTeam &&
      !("placeholder" in match.awayTeam)
    ) {
      const { home, away } = predictMatchScore(
        match.homeTeam as Team,
        match.awayTeam as Team,
      );

      let homePen: number | null = null;
      let awayPen: number | null = null;

      // If draw, simulate penalties
      if (home === away) {
        do {
          homePen = Math.floor(Math.random() * 5) + 3;
          awayPen = Math.floor(Math.random() * 5) + 3;
        } while (homePen === awayPen);
      }

      onMatchUpdate(match.id, home, away, homePen, awayPen);
    }
  };

  const handleResetMatch = (match: KnockoutMatch) => {
    onMatchUpdate(match.id, null, null, null, null);
  };

  const R32_ORDER = ["74", "77", "73", "75", "83", "84", "81", "82", "76", "78", "79", "80", "86", "88", "85", "87"];
  const R16_ORDER = ["89", "90", "93", "94", "91", "92", "95", "96"];
  const QF_ORDER = ["97", "98", "99", "100"];
  const SF_ORDER = ["101", "102"];

  const r32Matches = matches
    .filter((m) => m.stage === "R32")
    .sort((a, b) => R32_ORDER.indexOf(a.id) - R32_ORDER.indexOf(b.id));
  const r16Matches = matches
    .filter((m) => m.stage === "R16")
    .sort((a, b) => R16_ORDER.indexOf(a.id) - R16_ORDER.indexOf(b.id));
  const qfMatches = matches
    .filter((m) => m.stage === "QF")
    .sort((a, b) => QF_ORDER.indexOf(a.id) - QF_ORDER.indexOf(b.id));
  const sfMatches = matches
    .filter((m) => m.stage === "SF")
    .sort((a, b) => SF_ORDER.indexOf(a.id) - SF_ORDER.indexOf(b.id));

  const finalMatch = matches.find((m) => m.id === "104");
  const thirdPlaceMatch = matches.find((m) => m.id === "103");

  const champion = finalMatch?.winner;

  // Track if Final Match is in view to toggle floating banner
  const [isFinalMatchVisible, setIsFinalMatchVisible] = useState(false);
  const finalMatchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFinalMatchVisible(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-15% 0px -40% 0px", // Expand visible area to avoid collision with 3rd place match
      },
    );

    if (finalMatchRef.current) {
      observer.observe(finalMatchRef.current);
    }

    return () => observer.disconnect();
  }, [finalMatch]);

  useEffect(() => {
    if (
      champion &&
      dbUser?.favoriteTeam &&
      champion.name === dbUser.favoriteTeam
    ) {
      const end = Date.now() + 3 * 1000;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [champion, dbUser]);

  const r32Pairs = pairMatches(r32Matches);
  const r16Pairs = pairMatches(r16Matches);
  const qfPairs = pairMatches(qfMatches);
  const sfPairs = pairMatches(sfMatches);

  const [activeMobileRound, setActiveMobileRound] = useState<"r32" | "r16" | "qf" | "sf" | "f">("r32");

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up mt-4 md:mt-8">

      {/* Mobile Round Selector */}
      <div className="md:hidden px-4 mb-2">
        <div className="flex p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto scrollbar-none gap-1 border border-slate-200/50 dark:border-slate-700/50">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setActiveMobileRound(stage.id)}
              className={clsx(
                "flex-1 px-3 py-2 text-[11px] font-bold rounded-lg text-center whitespace-nowrap transition-all duration-200 focus:outline-none",
                activeMobileRound === stage.id
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {stage.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Vertical Bracket View */}
      <div className="md:hidden px-4 space-y-4">
        {activeMobileRound === "r32" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              16avos de Final
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {r32Matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  roundName="R32"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                />
              ))}
            </div>
          </div>
        )}
        {activeMobileRound === "r16" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Octavos de Final
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {r16Matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  roundName="R16"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                />
              ))}
            </div>
          </div>
        )}
        {activeMobileRound === "qf" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Cuartos de Final
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {qfMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  roundName="QF"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                />
              ))}
            </div>
          </div>
        )}
        {activeMobileRound === "sf" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Semifinales
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {sfMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  roundName="SF"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                />
              ))}
            </div>
          </div>
        )}
        {activeMobileRound === "f" && (
          <div className="space-y-6">
            {champion && (
              <div className="flex justify-center">
                <ChampionBanner champion={champion} />
              </div>
            )}

            {finalMatch && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  Final
                </h3>
                <MatchCard
                  match={finalMatch}
                  roundName="Final"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                />
              </div>
            )}

            {thirdPlaceMatch && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  Tercer Puesto
                </h3>
                <MatchCard
                  match={thirdPlaceMatch}
                  roundName="3rdPlace"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Horizontal Bracket View */}
      <div className="hidden md:block pb-4">
        <div
          className="grid gap-x-8 gap-y-4 px-4"
          style={{
            gridTemplateColumns: "repeat(5, minmax(170px, 1fr))",
            gridTemplateRows: "auto repeat(8, minmax(150px, auto)) auto",
          }}
        >
          {/* Stage Backgrounds & Headers */}
          {STAGES.map((stage) => (
            <div key={`stage-group-${stage.id}`} className="contents">
              <div
                key={`bg-${stage.id}`}
                className={clsx(
                  "row-start-1 row-span-full rounded-2xl -mx-2",
                  stage.bgClass,
                )}
                style={{ gridColumnStart: stage.colStart }}
              />
              {/* Top Header */}
              <div
                key={`top-header-${stage.id}`}
                className="row-start-1"
                style={{ gridColumnStart: stage.colStart }}
              >
                <h3
                  className={clsx(
                    "text-center py-2 px-3 rounded-xl font-semibold text-sm mb-4 -mx-2",
                    stage.headerClass,
                  )}
                >
                  {stage.label}
                </h3>
              </div>
              {/* Bottom Header */}
              <div
                key={`bottom-header-${stage.id}`}
                className="row-start-10"
                style={{ gridColumnStart: stage.colStart }}
              >
                <h3
                  className={clsx(
                    "text-center py-2 px-3 rounded-xl font-semibold text-sm mt-4 -mx-2",
                    stage.headerClass,
                  )}
                >
                  {stage.label}
                </h3>
              </div>
            </div>
          ))}

          {/* Round of 32 */}
          {r32Pairs.map((pair, i) => (
            <div
              key={`r32-${i}`}
              className="col-start-1"
              style={{ gridRow: i + 2 }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="R32"
                onUpdate={onMatchUpdate}
                onSimulate={handleSimulateMatch}
                onReset={handleResetMatch}
                tooltipPlacement="right"
              />
            </div>
          ))}

          {/* Round of 16 */}
          {r16Pairs.map((pair, i) => (
            <div
              key={`r16-${i}`}
              className="col-start-2"
              style={{ gridRow: `${i * 2 + 2} / span 2` }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="R16"
                onUpdate={onMatchUpdate}
                onSimulate={handleSimulateMatch}
                onReset={handleResetMatch}
              />
            </div>
          ))}

          {/* Quarter Finals */}
          {qfPairs.map((pair, i) => (
            <div
              key={`qf-${i}`}
              className="col-start-3"
              style={{ gridRow: `${i * 4 + 2} / span 4` }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="QF"
                onUpdate={onMatchUpdate}
                onSimulate={handleSimulateMatch}
                onReset={handleResetMatch}
              />
            </div>
          ))}

          {/* Semi Finals */}
          {sfPairs.map((pair, i) => (
            <div
              key={`sf-${i}`}
              className="col-start-4"
              style={{ gridRow: `${i * 8 + 2} / span 8` }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="SF"
                onUpdate={onMatchUpdate}
                onSimulate={handleSimulateMatch}
                onReset={handleResetMatch}
              />
            </div>
          ))}

          {/* Finals & 3rd Place */}
          <div
            className="col-start-5 relative"
            style={{ gridRow: "2 / span 8" }}
          >
            {/* Sticky/Floating Champion Banner */}
            {champion && !isFinalMatchVisible && (
              <div className="absolute inset-0 pointer-events-none z-30">
                <div className="sticky top-[50vh] w-full flex justify-center transform -translate-y-1/2">
                  <ChampionBanner champion={champion} isSticky />
                </div>
              </div>
            )}

            {/* Final Match - Centered */}
            {finalMatch && (
              <div
                ref={finalMatchRef}
                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10"
              >
                {/* Static Champion Banner (visible when final match is in view) */}
                {champion ? (
                  <div
                    className={clsx(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-max transition-opacity duration-300",
                      isFinalMatchVisible ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <ChampionBanner champion={champion} />
                  </div>
                ) : (
                  <h4 className="text-sm font-semibold text-center mb-2 text-slate-500">
                    Final
                  </h4>
                )}
                <MatchCard
                  match={finalMatch}
                  roundName="Final"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                  tooltipPlacement="left"
                />
                {/* Incoming Line Connector */}
                <div className="absolute top-1/2 left-0 w-4 h-[2px] bg-slate-300 dark:bg-slate-600 transform -translate-y-1/2 -translate-x-full" />
              </div>
            )}

            {/* 3rd Place Match - Bottom */}
            {thirdPlaceMatch && (
              <div className="absolute top-1/2 left-0 right-0 mt-32 z-10">
                <h4 className="text-sm font-semibold text-center mb-2 text-slate-500">
                  Tercer Puesto
                </h4>
                <MatchCard
                  match={thirdPlaceMatch}
                  roundName="3rdPlace"
                  onUpdate={onMatchUpdate}
                  onSimulate={handleSimulateMatch}
                  onReset={handleResetMatch}
                  tooltipPlacement="left"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third Place Table Removed (Migrated to GroupStage) */}

      <FloatingContainer>
        <Tooltip content="Simular resultados de las Llaves" placement="left">
          <FloatingButton
            onClick={simulateKnockout}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Simular Llaves
          </FloatingButton>
        </Tooltip>

        <Tooltip content="Simular todo el torneo" placement="left">
          <FloatingButton
            onClick={simulateAll}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.596-.218.797.065a.97.97 0 01-.19 1.316 5.061 5.061 0 00-.754.646.97.97 0 000 1.364l.015.015a.97.97 0 001.364 0l.015-.015a.97.97 0 011.364 0l.646.646a.97.97 0 001.364 0l.015-.015a.97.97 0 000-1.364l-.015-.015a.97.97 0 010-1.364l.646-.646a.97.97 0 000-1.364l-.015-.015a.97.97 0 00-1.364 0l-.015.015a.97.97 0 01-1.364 0l-.646-.646a.97.97 0 00-.22-.168zM10 18a8 8 0 100-16 8 8 0 000 16z"
                clipRule="evenodd"
              />
            </svg>
            Simular Todo
          </FloatingButton>
        </Tooltip>

        <Tooltip content="Limpiar todos los resultados" placement="left">
          <FloatingButton
            onClick={resetTournament}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 size={18} />
            Limpiar
          </FloatingButton>
        </Tooltip>
      </FloatingContainer>
    </div>
  );
}
