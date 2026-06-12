"use client";

import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

interface FlashScoreInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function FlashScoreInput({ className, value, ...props }: FlashScoreInputProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Only flash when the score value changes after the component has mounted
    // and only if the input is read-only (which represents a live score display)
    if (props.readOnly && value !== prevValueRef.current) {
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
