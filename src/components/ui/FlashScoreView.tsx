"use client";

import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

interface FlashScoreViewProps {
  homeScore: number | null;
  awayScore: number | null;
  className?: string;
}

export function FlashScoreView({ homeScore, awayScore, className }: FlashScoreViewProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevHomeRef = useRef(homeScore);
  const prevAwayRef = useRef(awayScore);

  useEffect(() => {
    // Only flash when score values change after component mount
    const homeChanged = homeScore !== null && prevHomeRef.current !== null && homeScore !== prevHomeRef.current;
    const awayChanged = awayScore !== null && prevAwayRef.current !== null && awayScore !== prevAwayRef.current;

    if (homeChanged || awayChanged) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 2500); // Highlight for 2.5 seconds
      
      prevHomeRef.current = homeScore;
      prevAwayRef.current = awayScore;
      return () => clearTimeout(timer);
    } else {
      // Keep refs updated on initial mount and when changes occur
      prevHomeRef.current = homeScore;
      prevAwayRef.current = awayScore;
    }
  }, [homeScore, awayScore]);

  return (
    <div
      className={clsx(
        className,
        "transition-all ease-out",
        isFlashing
          ? "bg-yellow-100 border-yellow-550 text-yellow-900 dark:bg-yellow-950/80 dark:border-yellow-450 dark:text-yellow-100 ring-2 ring-yellow-450/40 dark:ring-yellow-450/30 shadow-[0_0_12px_rgba(234,179,8,0.7)] scale-110 duration-100 z-10 font-extrabold"
          : "duration-[2000ms]"
      )}
    >
      {homeScore ?? 0} - {awayScore ?? 0}
    </div>
  );
}
