"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTournament } from "@/context/TournamentContext";
import { AnimatePresence, motion } from "framer-motion";
import { Timer } from "lucide-react";

interface NextMatchInfo {
  homeTeam: string;
  awayTeam: string;
  utcDate: string;
  location: string;
  stage: string;
  matchDay: string; // YYYY-MM-DD for schedule link
}

function getTeamNameFromKnockout(
  team: { name?: string; placeholder?: string } | null
): string {
  if (!team) return "Por definir";
  if ("placeholder" in team && team.placeholder) return team.placeholder;
  return team.name || "Por definir";
}

export function NextMatchCountdown() {
  const { groups, knockoutMatches } = useTournament();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextMatch = useMemo<NextMatchInfo | null>(() => {
    if (!now) return null;
    const currentTime = now.getTime();

    // Collect all matches with team names resolved
    type CandidateMatch = { utcDate: string; homeTeam: string; awayTeam: string; location: string; stage: string };
    const candidates: CandidateMatch[] = [];

    // Group stage matches
    for (const group of groups) {
      for (let i = 0; i < group.matches.length; i++) {
        const match = group.matches[i];
        const matchTime = new Date(match.utcDate).getTime();
        if (matchTime > currentTime) {
          const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
          const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);
          const matchday = Math.floor(i / 2) + 1;
          candidates.push({
            utcDate: match.utcDate,
            homeTeam: homeTeam?.name || match.homeTeamId,
            awayTeam: awayTeam?.name || match.awayTeamId,
            location: match.location || "",
            stage: `Grupo ${group.name} — Fecha ${matchday}`,
          });
        }
      }
    }

    // Knockout matches
    const STAGE_LABELS: Record<string, string> = {
      R32: "16avos de Final",
      R16: "Octavos de Final",
      QF: "Cuartos de Final",
      SF: "Semifinales",
      Final: "Final",
      "3rdPlace": "Tercer Puesto",
    };

    for (const match of knockoutMatches) {
      const matchTime = new Date(match.utcDate).getTime();
      if (matchTime > currentTime) {
        candidates.push({
          utcDate: match.utcDate,
          homeTeam: getTeamNameFromKnockout(match.homeTeam as { name?: string; placeholder?: string } | null),
          awayTeam: getTeamNameFromKnockout(match.awayTeam as { name?: string; placeholder?: string } | null),
          location: match.location || "",
          stage: STAGE_LABELS[match.stage] || match.stage,
        });
      }
    }

    if (candidates.length === 0) return null;

    // Sort by date and pick the earliest
    candidates.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
    const next = candidates[0];

    // Compute local date for schedule link
    const localDate = new Date(next.utcDate);
    const matchDay = localDate.toLocaleDateString("sv-SE"); // YYYY-MM-DD

    return {
      homeTeam: next.homeTeam,
      awayTeam: next.awayTeam,
      utcDate: next.utcDate,
      location: next.location,
      stage: next.stage,
      matchDay,
    };
  }, [now, groups, knockoutMatches]);

  // Compute countdown
  const countdown = useMemo(() => {
    if (!now || !nextMatch) return null;
    const diff = new Date(nextMatch.utcDate).getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [now, nextMatch]);

  if (!countdown || !nextMatch) return null;

  // Format the match time in local timezone
  const matchDate = new Date(nextMatch.utcDate);
  const matchTimeFormatted = matchDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const matchDateFormatted = matchDate.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // Build the compact countdown string
  const parts: string[] = [];
  if (countdown.days > 0) parts.push(`${countdown.days}d`);
  parts.push(`${countdown.hours.toString().padStart(2, "0")}h`);
  parts.push(`${countdown.minutes.toString().padStart(2, "0")}m`);
  parts.push(`${countdown.seconds.toString().padStart(2, "0")}s`);

  return (
    <Link
      href={`/schedule?day=${nextMatch.matchDay}`}
      className="group/countdown relative hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg 
        bg-blue-50/80 dark:bg-blue-950/40 
        border border-blue-200/60 dark:border-blue-800/40 
        hover:bg-blue-100/80 dark:hover:bg-blue-900/40 
        hover:border-blue-300 dark:hover:border-blue-700 
        transition-all duration-200 cursor-pointer shrink-0"
    >
      {/* Pulse dot */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-4 h-4 rounded-full bg-blue-500/20 dark:bg-blue-400/15 animate-ping" />
        <Timer className="relative w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Countdown digits */}
      <div className="flex items-baseline gap-0.5 font-mono text-xs font-bold tabular-nums text-blue-700 dark:text-blue-300">
        {parts.map((part, i) => (
          <span key={i} className="flex items-baseline">
            {i > 0 && (
              <span className="text-blue-400/60 dark:text-blue-500/60 mx-px text-[10px]">:</span>
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={part}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                {part}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
      </div>

      {/* Hover tooltip */}
      <div className="absolute top-full right-0 mt-2 w-64 opacity-0 invisible 
        group-hover/countdown:opacity-100 group-hover/countdown:visible 
        transition-all duration-200 z-50 pointer-events-none group-hover/countdown:pointer-events-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1.5">
            Próximo partido
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {nextMatch.homeTeam}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0">vs</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate text-right">
              {nextMatch.awayTeam}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold capitalize">{matchDateFormatted}</span> · {matchTimeFormatted} hs
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              📍 {nextMatch.location.split(" - ")[0]}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {nextMatch.stage}
            </p>
          </div>
          <p className="mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            Ver en Cronograma →
          </p>
        </div>
      </div>
    </Link>
  );
}
