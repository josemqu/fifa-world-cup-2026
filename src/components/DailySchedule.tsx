"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Group, Match, KnockoutMatch, Team } from "@/data/types";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { MatchDateTime } from "@/components/ui/MatchDateTime";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTournament } from "@/context/TournamentContext";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { clsx } from "clsx";

interface DailyScheduleProps {
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
}

type NormalizedMatch = {
  id: string;
  utcDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null | undefined;
  awayScore: number | null | undefined;
  location?: string;
  stage: string; // "Grupo A", "16avos", etc.
  isKnockout: boolean;
  groupId?: string;
};

const STAGE_LABELS: Record<string, string> = {
  R32: "16avos de Final",
  R16: "Octavos de Final",
  QF: "Cuartos de Final",
  SF: "Semifinales",
  Final: "Final",
  "3rdPlace": "Tercer Puesto",
};

function getTeamNameFromKnockout(
  team: Team | null | { placeholder: string }
): string {
  if (!team) return "Por definir";
  if ("placeholder" in team) return team.placeholder;
  return team.name;
}

export function DailySchedule({
  groups,
  knockoutMatches,
}: DailyScheduleProps) {
  // Normalize all matches into a unified format
  const allMatches = useMemo<NormalizedMatch[]>(() => {
    const result: NormalizedMatch[] = [];

    // Group stage matches
    for (const group of groups) {
      for (const match of group.matches) {
        const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
        const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);
        result.push({
          id: match.id,
          utcDate: match.utcDate,
          homeTeamName: homeTeam?.name || match.homeTeamId,
          awayTeamName: awayTeam?.name || match.awayTeamId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          location: match.location,
          stage: `Grupo ${group.name}`,
          isKnockout: false,
          groupId: group.name,
        });
      }
    }

    // Knockout matches
    for (const match of knockoutMatches) {
      result.push({
        id: match.id,
        utcDate: match.utcDate,
        homeTeamName: getTeamNameFromKnockout(match.homeTeam),
        awayTeamName: getTeamNameFromKnockout(match.awayTeam),
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        location: match.location,
        stage: STAGE_LABELS[match.stage] || match.stage,
        isKnockout: true,
      });
    }

    return result.sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );
  }, [groups, knockoutMatches]);

  // Group matches by local date string (e.g., "2026-06-11")
  const { matchesByDay, sortedDays } = useMemo(() => {
    const byDay = new Map<string, NormalizedMatch[]>();

    for (const match of allMatches) {
      const localDate = new Date(match.utcDate);
      const dateKey = localDate.toLocaleDateString("sv-SE"); // YYYY-MM-DD format
      if (!byDay.has(dateKey)) {
        byDay.set(dateKey, []);
      }
      byDay.get(dateKey)!.push(match);
    }

    const days = Array.from(byDay.keys()).sort();
    return { matchesByDay: byDay, sortedDays: days };
  }, [allMatches]);

  // Find the "best" initial day - today if there are matches, otherwise the first day
  const searchParams = useSearchParams();
  const getInitialDayIndex = useCallback(() => {
    if (sortedDays.length === 0) return 0;
    
    // Check for simulatedTime
    const simulatedTime = searchParams.get("simulatedTime");
    const now = simulatedTime ? new Date(simulatedTime) : new Date();
    const today = now.toLocaleDateString("sv-SE");
    
    const todayIndex = sortedDays.indexOf(today);
    if (todayIndex !== -1) return todayIndex;

    // Find the closest future day
    const futureIndex = sortedDays.findIndex((d) => d >= today);
    if (futureIndex !== -1) return futureIndex;

    // All days are past, show the last day
    return sortedDays.length - 1;
  }, [sortedDays]);

  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  useEffect(() => {
    setCurrentDayIndex(getInitialDayIndex());
  }, [getInitialDayIndex]);

  if (sortedDays.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        No hay partidos programados.
      </div>
    );
  }

  const currentDay = sortedDays[currentDayIndex];
  const currentMatches = matchesByDay.get(currentDay) || [];

  // Group by hour
  const matchesByHour = new Map<string, NormalizedMatch[]>();
  for (const match of currentMatches) {
    const localDate = new Date(match.utcDate);
    const hourKey = localDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (!matchesByHour.has(hourKey)) {
      matchesByHour.set(hourKey, []);
    }
    matchesByHour.get(hourKey)!.push(match);
  }

  const sortedHours = Array.from(matchesByHour.keys()).sort();

  // Format the current day for display
  const dayDate = new Date(currentDay + "T12:00:00"); // noon to avoid TZ quirks
  const formattedDay = dayDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Capitalize first letter
  const displayDay = formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1);

  const goToPrevDay = () => {
    setCurrentDayIndex((i) => Math.max(0, i - 1));
  };

  const goToNextDay = () => {
    setCurrentDayIndex((i) => Math.min(sortedDays.length - 1, i + 1));
  };

  const goToToday = () => {
    setCurrentDayIndex(getInitialDayIndex());
  };

  return (
    <div className="animate-fade-in-up">
      {/* Day Navigation */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 px-4 py-3">
        <Tooltip content="Día anterior" placement="top">
          <button
            onClick={goToPrevDay}
            disabled={currentDayIndex === 0}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              currentDayIndex === 0
                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <ChevronLeft size={20} />
          </button>
        </Tooltip>

        <div className="flex flex-col items-center gap-1">
          <Tooltip content="Ir al día más cercano a hoy" placement="top">
            <button
              onClick={goToToday}
              className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <Calendar size={12} />
              <span>Hoy</span>
            </button>
          </Tooltip>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center">
            {displayDay}
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {currentMatches.length} partido{currentMatches.length !== 1 ? "s" : ""} ·
            Día {currentDayIndex + 1} de {sortedDays.length}
          </span>
        </div>

        <Tooltip content="Día siguiente" placement="top">
          <button
            onClick={goToNextDay}
            disabled={currentDayIndex === sortedDays.length - 1}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              currentDayIndex === sortedDays.length - 1
                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <ChevronRight size={20} />
          </button>
        </Tooltip>
      </div>

      {/* Matches by Hour */}
      <div className="space-y-4">
        {sortedHours.map((hour) => {
          const hourMatches = matchesByHour.get(hour)!;
          return (
            <div key={hour}>
              {/* Hour Header */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  {hour}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {hourMatches.length} partido{hourMatches.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Match Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {hourMatches.map((match) => (
                  <ScheduleMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleMatchCard({ match }: { match: NormalizedMatch }) {
  const { updateMatch, updateKnockoutMatch } = useTournament();

  const handleScoreChange = (
    side: "home" | "away",
    val: string
  ) => {
    const score = val === "" ? null : parseInt(val);
    if (match.isKnockout) {
      updateKnockoutMatch(
        match.id,
        side === "home" ? score : (match.homeScore ?? null),
        side === "away" ? score : (match.awayScore ?? null)
      );
    } else if (match.groupId) {
      updateMatch(
        match.groupId,
        match.id,
        side === "home" ? score : (match.homeScore ?? null),
        side === "away" ? score : (match.awayScore ?? null)
      );
    }
  };

  const isPlaceholder = match.homeTeamName === "Por definir" || match.awayTeamName === "Por definir";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-600">
      {/* Header: Stage + Status */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {match.stage}
        </span>
        <MatchDateTime
          utcDate={match.utcDate}
          dateClassName="text-[10px] font-medium text-slate-400 dark:text-slate-500"
          timeClassName="text-[10px] font-bold text-slate-600 dark:text-slate-300"
        />
      </div>

      {/* Teams */}
      <div className="p-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Home */}
          <div className="flex items-center gap-2 min-w-0">
            <TeamFlag
              teamName={match.homeTeamName}
              className="w-6 h-4 shrink-0"
            />
            <Tooltip 
              content={match.homeTeamName} 
              placement="top"
              wrapperClassName="min-w-0 flex-1"
            >
              <span
                className={clsx(
                  "text-sm font-medium truncate block cursor-default",
                  match.homeTeamName === "Por definir" || match.isKnockout && match.homeScore === null
                    ? "text-slate-400 dark:text-slate-500 italic"
                    : "text-slate-900 dark:text-slate-100"
                )}
              >
                {match.homeTeamName}
              </span>
            </Tooltip>
          </div>

          {/* Score Inputs */}
          <div className="flex items-center gap-1 shrink-0 mx-2">
            <input
              type="number"
              min="0"
              placeholder="-"
              disabled={isPlaceholder}
              value={match.homeScore ?? ""}
              onChange={(e) => handleScoreChange("home", e.target.value)}
              className="w-8 h-8 text-center text-xs font-bold bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-30 transition-all appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-400 dark:text-slate-600 font-bold text-[10px]">
              :
            </span>
            <input
              type="number"
              min="0"
              placeholder="-"
              disabled={isPlaceholder}
              value={match.awayScore ?? ""}
              onChange={(e) => handleScoreChange("away", e.target.value)}
              className="w-8 h-8 text-center text-xs font-bold bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-30 transition-all appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Away */}
          <div className="flex items-center gap-2 min-w-0 justify-end">
            <Tooltip 
              content={match.awayTeamName} 
              placement="top"
              wrapperClassName="min-w-0 flex-1"
            >
              <span
                className={clsx(
                  "text-sm font-medium truncate block text-right cursor-default",
                  match.awayTeamName === "Por definir" || match.isKnockout && match.awayScore === null
                    ? "text-slate-400 dark:text-slate-500 italic"
                    : "text-slate-900 dark:text-slate-100"
                )}
              >
                {match.awayTeamName}
              </span>
            </Tooltip>
            <TeamFlag
              teamName={match.awayTeamName}
              className="w-6 h-4 shrink-0"
            />
          </div>
        </div>

        {/* Location */}
        {match.location && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <Tooltip content={match.location} placement="bottom">
              <p
                className="text-[10px] text-slate-400 dark:text-slate-500 truncate cursor-help"
              >
                📍 {match.location.split(" - ")[0]}
                {match.location.includes(" - ") && (
                  <span className="text-slate-300 dark:text-slate-600">
                    {" — "}
                    {match.location.split(" - ")[1]}
                  </span>
                )}
              </p>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
