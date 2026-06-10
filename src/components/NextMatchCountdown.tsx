"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTournament } from "@/context/TournamentContext";
import { AnimatePresence, motion } from "framer-motion";
import { Timer } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useCurrentTime } from "@/hooks/useCurrentTime";

interface NextMatchInfo {
  matchId: string;
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
  const now = useCurrentTime(true);

  const nextMatch = useMemo<NextMatchInfo | null>(() => {
    if (!now) return null;
    const currentTime = now.getTime();

    // Collect all matches with team names resolved
    type CandidateMatch = { id: string; utcDate: string; homeTeam: string; awayTeam: string; location: string; stage: string };
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
            id: match.id,
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
          id: match.id,
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
      matchId: next.id,
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

  if (!now) {
    return (
      <div className="w-[154px] h-[34px] bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/20 dark:border-blue-800/10 rounded-lg animate-pulse shrink-0" />
    );
  }

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

  // Build segments to separate digits from labels
  const segments = [
    { value: countdown.days, label: "d", show: countdown.days > 0, pad: 0 },
    { value: countdown.hours, label: "h", show: true, pad: 2 },
    { value: countdown.minutes, label: "m", show: true, pad: 2 },
    { value: countdown.seconds, label: "s", show: true, pad: 2 },
  ];
  const activeSegments = segments.filter((s) => s.show);

  return (
    <Tooltip
      placement="bottom"
      interactive={true}
      content={
        <div className="text-left min-w-[200px] p-1 font-sans">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1.5">
            Próximo partido
          </p>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-white truncate max-w-[90px]" title={nextMatch.homeTeam}>
              {nextMatch.homeTeam}
            </span>
            <span className="text-[9px] font-bold text-slate-400 shrink-0">vs</span>
            <span className="font-bold text-white truncate max-w-[90px] text-right" title={nextMatch.awayTeam}>
              {nextMatch.awayTeam}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1 text-[10px] font-normal text-slate-300">
            <p>
              <span className="font-semibold capitalize text-slate-200">{matchDateFormatted}</span> · {matchTimeFormatted} hs
            </p>
            <p className="truncate text-slate-400" title={nextMatch.location}>
              📍 {nextMatch.location.split(" - ")[0]}
            </p>
            <p className="text-slate-400">
              {nextMatch.stage}
            </p>
          </div>
          <Link
            href={`/schedule?day=${nextMatch.matchDay}&match=${nextMatch.matchId}&t=${Date.now()}`}
            className="mt-2 block text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver en Cronograma →
          </Link>
        </div>
      }
      wrapperClassName="hidden md:block cursor-pointer shrink-0"
      className="!font-normal"
    >
      <Link
        href={`/schedule?day=${nextMatch.matchDay}&match=${nextMatch.matchId}&t=${Date.now()}`}
        className="group/countdown relative flex items-center justify-center gap-2 w-[154px] h-[34px] px-3 rounded-lg 
          bg-blue-50/80 dark:bg-blue-950/40 
          border border-blue-200/60 dark:border-blue-800/40 
          hover:bg-blue-100/80 dark:hover:bg-blue-900/40 
          hover:border-blue-300 dark:hover:border-blue-700 
          transition-all duration-200 shrink-0"
      >
        {/* Pulse dot */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-4 h-4 rounded-full bg-blue-500/20 dark:bg-blue-400/15 animate-ping" />
          <Timer className="relative w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Countdown digits */}
        <div className="flex items-baseline gap-0.5 font-mono text-xs font-bold tabular-nums text-blue-700 dark:text-blue-300">
          {activeSegments.map((seg, segIdx) => {
            const valString = seg.pad > 0 
              ? seg.value.toString().padStart(seg.pad, "0") 
              : seg.value.toString();

            return (
              <span key={seg.label} className="flex items-baseline select-none">
                {segIdx > 0 && (
                  <span className="text-blue-400/60 dark:text-blue-500/60 mx-0.5 text-[10px]">:</span>
                )}
                {/* Animated digits */}
                <span className="flex">
                  {valString.split("").map((char, charIdx) => (
                    <span key={charIdx} className="inline-flex overflow-hidden h-4 items-center">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={`${charIdx}-${char}`}
                          initial={{ y: -8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 8, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                          className="inline-block"
                        >
                          {char}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  ))}
                </span>
                {/* Static unit label */}
                <span className="text-blue-400 dark:text-blue-500 text-[10px] ml-0.5 font-bold">
                  {seg.label}
                </span>
              </span>
            );
          })}
        </div>
      </Link>
    </Tooltip>
  );
}
