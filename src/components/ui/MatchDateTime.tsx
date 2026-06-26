"use client";

import { useMatchTime } from "@/hooks/useMatchTime";
import { Tooltip } from "@/components/ui/Tooltip";
import { clsx } from "clsx";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useTournament } from "@/context/TournamentContext";

interface MatchDateTimeProps {
  utcDate: string;
  matchId?: string;
  className?: string;
  timeClassName?: string;
  dateClassName?: string;
}

function getRelativeTime(matchDate: Date, now: Date): string | null {
  const diffMs = matchDate.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    if (diffDays === 1) {
      // Check if it's actually "tomorrow" or just 24h+
      return "Falta 1 día";
    }
    return `Faltan ${diffDays} días`;
  }
  
  if (diffHours > 0) {
    return `Faltan ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  }
  
  if (diffMin > 0) {
    return `Faltan ${diffMin} minuto${diffMin > 1 ? "s" : ""}`;
  }
  
  return "Comienza ahora";
}

export function MatchDateTime({
  utcDate,
  matchId,
  className = "",
  timeClassName = "",
  dateClassName = "font-medium text-slate-500 dark:text-slate-400",
}: MatchDateTimeProps) {
  const { date: localDate, time: localTime } = useMatchTime(utcDate);
  const now = useCurrentTime(true);
  const { groups, knockoutMatches } = useTournament();

  // Find match live state in TournamentContext
  let matchStatus: string | undefined;
  let matchElapsed: number | null | undefined;
  let matchLastSync: string | undefined;

  if (matchId) {
    // Check group stage matches
    for (const group of groups) {
      const m = group.matches.find((x) => x.id === matchId);
      if (m) {
        matchStatus = m.status;
        matchElapsed = m.elapsed;
        matchLastSync = m.lastSyncAt;
        break;
      }
    }
    // Check knockout matches
    if (!matchStatus) {
      const m = knockoutMatches.find((x) => x.id === matchId);
      if (m) {
        matchStatus = m.status;
        matchElapsed = m.elapsed;
        matchLastSync = m.lastSyncAt;
      }
    }
  }

  const matchDate = new Date(utcDate);
  // Asumimos 120 minutos de duración de partido (90m + 15m entretiempo + descuentos)
  const matchEndDate = new Date(matchDate.getTime() + 120 * 60000);

  const isPlaying = matchStatus
    ? (matchStatus === "live" || matchStatus === "halftime")
    : (now ? now >= matchDate && now < matchEndDate : false);

  const isFinished = matchStatus
    ? matchStatus === "finished"
    : (now ? now >= matchEndDate : false);

  const currentElapsed = (() => {
    if (!now) return 0;
    if (matchStatus === "halftime") return -1;
    if (matchElapsed !== undefined && matchElapsed !== null) {
      const timeSinceSync = matchLastSync
        ? Math.floor((Date.now() - new Date(matchLastSync).getTime()) / 60000)
        : 0;
      return Math.min(120, (matchElapsed || 0) + Math.max(0, timeSinceSync));
    }
    return Math.max(0, Math.floor((now.getTime() - matchDate.getTime()) / 60000));
  })();

  const displayedMinute = (() => {
    if (matchElapsed !== undefined && matchElapsed !== null) {
      return currentElapsed;
    }
    if (currentElapsed <= 45) return currentElapsed;
    if (currentElapsed < 50) return 45;
    if (currentElapsed < 65) return -1;
    if (currentElapsed <= 110) return currentElapsed - 20;
    return 90;
  })();

  const isHydrationBreak = isPlaying && (
    (displayedMinute >= 22 && displayedMinute <= 25) ||
    (displayedMinute >= 67 && displayedMinute <= 70)
  );

  const remainingTime = now && !isPlaying && !isFinished ? getRelativeTime(matchDate, now) : null;

  const getLiveMinuteText = () => {
    if (!now) return "0'";
    if (matchStatus === "halftime") return "ET";

    if (matchElapsed !== undefined && matchElapsed !== null) {
      const timeSinceSync = matchLastSync
        ? Math.floor((Date.now() - new Date(matchLastSync).getTime()) / 60000)
        : 0;
      const currentElapsed = Math.min(120, (matchElapsed || 0) + Math.max(0, timeSinceSync));
      if (matchElapsed <= 45) {
        return currentElapsed <= 45 ? `${currentElapsed}'` : `45+${currentElapsed - 45}'`;
      } else {
        return currentElapsed <= 90 ? `${currentElapsed}'` : `90+${currentElapsed - 90}'`;
      }
    }

    const elapsed = Math.floor((now.getTime() - matchDate.getTime()) / 60000);
    if (elapsed < 0) return "0'";
    if (elapsed <= 45) return `${elapsed}'`;
    if (elapsed < 50) return `45+${elapsed - 45}'`;
    if (elapsed < 65) return "ET";
    if (elapsed <= 110) return `${elapsed - 20}'`;
    return `90+${elapsed - 110}'`;
  };

  const dateTimeContent = (
    <div className="flex items-center gap-1.5">
      <span className={dateClassName}>
        {localDate}
      </span>
      {localTime && (
        <>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className={timeClassName}>
            {localTime}
          </span>
        </>
      )}
      {matchId && (
        <>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <span className="font-mono text-slate-400 text-[10px]">
            #{matchId}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {remainingTime ? (
        <Tooltip content={remainingTime} placement="top">
          {dateTimeContent}
        </Tooltip>
      ) : (
        dateTimeContent
      )}
      
      {now && isPlaying && (
        <Tooltip content="En juego" placement="top">
          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-200/30 animate-pulse">
            <span className="relative flex h-1.5 w-1.5 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            {getLiveMinuteText()}
          </div>
        </Tooltip>
      )}

      {now && isPlaying && isHydrationBreak && (
        <Tooltip content="Hydration Break (Pausa de hidratación)" placement="top">
          <div className="flex items-center gap-1 bg-sky-50 dark:bg-sky-950/40 text-sky-650 dark:text-sky-400 px-1.5 py-0.5 rounded text-[10px] font-extrabold border border-sky-200/30 dark:border-sky-800/30">
            <span className="relative flex h-1 w-1 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1 w-1 bg-sky-550"></span>
            </span>
            <span>HB</span>
          </div>
        </Tooltip>
      )}

      {now && isFinished && (
        <Tooltip content="Finalizado" placement="top">
          <div className="text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800/50 border border-slate-200/20 dark:border-slate-700/20">
            Fin
          </div>
        </Tooltip>
      )}
    </div>
  );
}
