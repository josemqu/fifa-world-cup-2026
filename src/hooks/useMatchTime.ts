"use client";

import { useState, useEffect } from "react";
import { getLocalDateAndTime } from "@/utils/dateUtils";

export function useMatchTime(date: string, time?: string) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return { date, time: time || "" };
  }

  return getLocalDateAndTime(date, time || "");
}
