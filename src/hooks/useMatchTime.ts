"use client";

import { useState, useEffect } from "react";
import { getLocalDateAndTime } from "@/utils/dateUtils";

export function useMatchTime(utcDate: string) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return { date: "", time: "" };
  }

  return getLocalDateAndTime(utcDate);
}
