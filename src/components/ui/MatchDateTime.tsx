"use client";

import { useMatchTime } from "@/hooks/useMatchTime";
import { Tooltip } from "@/components/ui/Tooltip";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

interface MatchDateTimeProps {
  utcDate: string;
  matchId?: string;
  className?: string;
  timeClassName?: string;
  dateClassName?: string;
}

export function MatchDateTime({
  utcDate,
  matchId,
  className = "",
  timeClassName = "",
  dateClassName = "font-medium text-slate-500 dark:text-slate-400",
}: MatchDateTimeProps) {
  const { date: localDate, time: localTime } = useMatchTime(utcDate);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const getNow = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const simulatedTime = params.get("simulatedTime");
        if (simulatedTime) {
          return new Date(simulatedTime);
        }
      }
      return new Date();
    };

    setNow(getNow());
    const interval = setInterval(() => setNow(getNow()), 60000);
    return () => clearInterval(interval);
  }, []);

  const matchDate = new Date(utcDate);
  // Asumimos 120 minutos de duración de partido (90m + 15m entretiempo + descuentos)
  const matchEndDate = new Date(matchDate.getTime() + 120 * 60000);

  const isPlaying = now ? now >= matchDate && now < matchEndDate : false;
  const isFinished = now ? now >= matchEndDate : false;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
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
    </div>
  );
}
