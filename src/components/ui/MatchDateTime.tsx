"use client";

import { useMatchTime } from "@/hooks/useMatchTime";

interface MatchDateTimeProps {
  utcDate: string;
  className?: string;
  timeClassName?: string;
}

export function MatchDateTime({
  utcDate,
  className = "",
  timeClassName = "",
}: MatchDateTimeProps) {
  const { date: localDate, time: localTime } = useMatchTime(utcDate);

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="font-medium text-slate-500 dark:text-slate-400">
        {localDate}
      </span>
      {localTime && (
        <span className={`text-[9px] text-slate-400 dark:text-slate-500 ${timeClassName}`}>
          {localTime}
        </span>
      )}
    </div>
  );
}
