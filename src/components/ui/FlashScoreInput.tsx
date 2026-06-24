"use client";

import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

interface FlashScoreInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function FlashScoreInput({ className, value, ...props }: FlashScoreInputProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevValueRef = useRef(value);
  const mountedTimeRef = useRef(Date.now());

  useEffect(() => {
    const parseScore = (val: any): number | null => {
      if (val === null || val === undefined || val === "") return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const currentVal = parseScore(value);
    const prevVal = parseScore(prevValueRef.current);

    // Only flash when the score value increases (new goal) in a read-only live score display
    const hasIncreased = currentVal !== null && prevVal !== null && currentVal > prevVal;

    // Filter out initial load synchronization by ignoring transitions within the first 3 seconds of component mount
    const isInitialLoad = Date.now() - mountedTimeRef.current < 3000;

    if (props.readOnly && hasIncreased && !isInitialLoad) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 2500); // Show highlight for 2.5 seconds

      prevValueRef.current = value;
      return () => clearTimeout(timer);
    } else {
      prevValueRef.current = value;
    }
  }, [value, props.readOnly]);

  return (
    <input
      value={value}
      {...props}
      className={clsx(
        className,
        "transition-all ease-out",
        isFlashing
          ? "bg-yellow-100 border-yellow-500 text-yellow-900 dark:bg-yellow-950/80 dark:border-yellow-400 dark:text-yellow-100 ring-2 ring-yellow-400/40 dark:ring-yellow-400/30 shadow-[0_0_12px_rgba(234,179,8,0.7)] scale-110 duration-100 z-10 font-extrabold"
          : "duration-[2000ms]"
      )}
    />
  );
}
