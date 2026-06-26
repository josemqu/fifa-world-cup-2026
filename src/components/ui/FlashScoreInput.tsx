"use client";

import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

type FlashScoreInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function FlashScoreInput({
  className,
  value,
  onChange,
  onBlur,
  onKeyDown,
  ...props
}: FlashScoreInputProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevValueRef = useRef(value);
  const mountedTimeRef = useRef<number | null>(null);

  // Local state for smooth typing and debouncing when not read-only
  const [prevValue, setPrevValue] = useState(value);
  const [localValue, setLocalValue] = useState<string | number | readonly string[]>(value ?? "");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize local value with parent's value during render (recommended React pattern to avoid effect)
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value ?? "");
  }

  // Set the mount time once when component mounts to avoid impure render calls
  useEffect(() => {
    mountedTimeRef.current = Date.now();
  }, []);

  // Flash highlight logic
  useEffect(() => {
    const parseScore = (val: string | number | readonly string[] | undefined | null): number | null => {
      if (val === null || val === undefined || val === "") return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const currentVal = parseScore(value);
    const prevVal = parseScore(prevValueRef.current);

    // Only flash when the score value increases (new goal) in a read-only live score display
    const hasIncreased = currentVal !== null && prevVal !== null && currentVal > prevVal;

    // Filter out initial load synchronization by ignoring transitions within the first 3 seconds of component mount
    const mountTime = mountedTimeRef.current;
    const isInitialLoad = mountTime === null || Date.now() - mountTime < 3000;

    let flashTimer: NodeJS.Timeout | null = null;
    let clearTimer: NodeJS.Timeout | null = null;

    if (props.readOnly && hasIncreased && !isInitialLoad) {
      // Delay state changes to the next event loop tick to prevent synchronous cascading render warning
      flashTimer = setTimeout(() => {
        setIsFlashing(true);
      }, 0);

      clearTimer = setTimeout(() => {
        setIsFlashing(false);
      }, 2500); // Show highlight for 2.5 seconds
    }

    prevValueRef.current = value;

    return () => {
      if (flashTimer) clearTimeout(flashTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [value, props.readOnly]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const flushChange = (val: string | number | readonly string[]) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Only propagate if the value is actually different from the last known prop value
    const stringifiedVal = String(val);
    const stringifiedProp = value !== null && value !== undefined ? String(value) : "";

    if (stringifiedVal !== stringifiedProp && onChange) {
      const syntheticEvent = {
        target: {
          ...props,
          value: stringifiedVal,
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushChange(newVal);
    }, 400); // 400ms debounce
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    flushChange(localValue);
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      flushChange(localValue);
      e.currentTarget.blur();
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <input
      value={props.readOnly ? (value ?? "") : localValue}
      onChange={props.readOnly ? undefined : handleChange}
      onBlur={props.readOnly ? undefined : handleBlur}
      onKeyDown={props.readOnly ? undefined : handleKeyDown}
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
