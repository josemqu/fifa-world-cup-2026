"use client";

import { useMatchTime } from "@/hooks/useMatchTime";
import { Tooltip } from "@/components/ui/Tooltip";
import { clsx } from "clsx";
import { useCurrentTime } from "@/hooks/useCurrentTime";

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

  const matchDate = new Date(utcDate);
  // Asumimos 120 minutos de duración de partido (90m + 15m entretiempo + descuentos)
  const matchEndDate = new Date(matchDate.getTime() + 120 * 60000);

  const isPlaying = now ? now >= matchDate && now < matchEndDate : false;
  const isFinished = now ? now >= matchEndDate : false;
  const remainingTime = now && !isPlaying && !isFinished ? getRelativeTime(matchDate, now) : null;

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
      
      {now && (isPlaying || isFinished) && (
        <Tooltip 
          content={isPlaying ? "En juego" : "Finalizado"} 
          placement="top"
        >
          <div className="relative flex h-2 w-2 cursor-help ml-0.5">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span className={clsx(
              "relative inline-flex rounded-full h-2 w-2",
              isPlaying ? "bg-green-500" : "bg-slate-400 dark:bg-slate-600"
            )}></span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}
