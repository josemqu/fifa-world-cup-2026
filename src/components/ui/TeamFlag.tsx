import React from "react";
import Flag from "react-world-flags";
import { getCountryIsoCode } from "@/utils/countries";
import { clsx } from "clsx";

interface TeamFlagProps {
  teamName: string;
  className?: string;
  showPlaceholder?: boolean;
}

export function TeamFlag({
  teamName,
  className,
  showPlaceholder = false, // Kept for backward compatibility but largely unused for "hiding" now
}: TeamFlagProps) {
  // If no team name is provided, render nothing
  if (!teamName) return null;

  // Get the ISO code for the flag
  const code = getCountryIsoCode(teamName);
  const isValidCountryCode = !!code;

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center overflow-hidden rounded-sm shadow-sm bg-white border border-slate-200 dark:border-slate-700",
        className
      )}
      title={teamName}
    >
      {isValidCountryCode ? (
        <Flag
          code={code}
          className="object-cover w-full h-full"
          alt={`Bandera de ${teamName}`}
        />
      ) : (
        /* White flag placeholder */
        <div className="w-full h-full bg-white dark:bg-slate-100" />
      )}
    </div>
  );
}
