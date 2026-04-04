"use client";

import { useMatchTime } from "@/hooks/useMatchTime";

interface MatchDateTimeProps {
  date: string;
  time?: string;
  className?: string;
  timeClassName?: string;
}

export function MatchDateTime({
  date,
  time = "",
  className = "",
  timeClassName = "",
}: MatchDateTimeProps) {
  const { date: localDate, time: localTime } = useMatchTime(date, time);

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="font-medium text-slate-500 dark:text-slate-400">
        {localDate}
      </span>
      {time && (
        <span className={`text-[9px] text-slate-400 dark:text-slate-500 ${timeClassName}`}>
          {localTime}
        </span>
      )}
    </div>
  );
}
