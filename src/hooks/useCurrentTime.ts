"use client";

import { useState, useEffect } from "react";

export function useCurrentTime(tick = true) {
  const [now, setNow] = useState<Date | null>(null);
  const [simTimeVal, setSimTimeVal] = useState<string | null>(null);

  useEffect(() => {
    const getSimTime = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const querySim = params.get("simulatedTime");
        if (querySim) return querySim;
        
        return window.localStorage.getItem("simulatedTime");
      }
      return null;
    };

    setSimTimeVal(getSimTime());

    const handleUpdate = () => {
      setSimTimeVal(getSimTime());
    };

    window.addEventListener("simulated-time-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("popstate", handleUpdate);

    // Also intercept click transitions on Next.js client-side navigation
    // by polling check periodically or subscribing to custom events
    const interval = setInterval(handleUpdate, 1000);

    return () => {
      window.removeEventListener("simulated-time-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("popstate", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (simTimeVal) {
      const baseTime = new Date(simTimeVal).getTime();
      if (!isNaN(baseTime)) {
        const startTime = Date.now();
        setNow(new Date(baseTime));

        if (!tick) return;

        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          setNow(new Date(baseTime + elapsed));
        }, 1000);

        return () => clearInterval(interval);
      }
    }

    setNow(new Date());
    if (!tick) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [simTimeVal, tick]);

  return now;
}
