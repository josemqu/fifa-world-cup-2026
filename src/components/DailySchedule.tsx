"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { Group, KnockoutMatch, Team } from "@/data/types";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { MatchDateTime } from "@/components/ui/MatchDateTime";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTournament } from "@/context/TournamentContext";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { FlashScoreInput } from "@/components/ui/FlashScoreInput";


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

const TOURNAMENT_START = "2026-06-11";
const TOURNAMENT_END = "2026-07-19";

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
      group.matches.forEach((match, i) => {
        const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
        const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);
        const matchday = Math.floor(i / 2) + 1;
        
        result.push({
          id: match.id,
          utcDate: match.utcDate,
          homeTeamName: homeTeam?.name || match.homeTeamId,
          awayTeamName: awayTeam?.name || match.awayTeamId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          location: match.location,
          stage: `Fase de grupos — Fecha ${matchday}`,
          isKnockout: false,
          groupId: group.name,
        });
      });
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

    const sorted = result.sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );

    // Final results Map to ensure unique IDs (safety against data inconsistencies)
    const uniqueMap = new Map<string, NormalizedMatch>();
    sorted.forEach((m) => uniqueMap.set(m.id, m));

    return Array.from(uniqueMap.values());
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

    // Generate ALL tournament days
    const days: string[] = [];
    const start = new Date(TOURNAMENT_START + "T00:00:00Z");
    const end = new Date(TOURNAMENT_END + "T00:00:00Z");
    const current = new Date(start);

    while (current <= end) {
      days.push(current.toISOString().split("T")[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return { matchesByDay: byDay, sortedDays: days };
  }, [allMatches]);

  // Find the "best" initial day - today if there are matches, otherwise the first day
  const searchParams = useSearchParams();
  const router = useRouter();
  const now = useCurrentTime(false);

  const { todayKey, yesterdayKey, tomorrowKey } = useMemo(() => {
    const currentDate = now || new Date();
    const today = currentDate.toLocaleDateString("sv-SE");
    
    const yest = new Date(currentDate);
    yest.setDate(currentDate.getDate() - 1);
    const yesterday = yest.toLocaleDateString("sv-SE");
    
    const tom = new Date(currentDate);
    tom.setDate(currentDate.getDate() + 1);
    const tomorrow = tom.toLocaleDateString("sv-SE");
    
    return { todayKey: today, yesterdayKey: yesterday, tomorrowKey: tomorrow };
  }, [now]);

  const currentDayIndex = useMemo(() => {
    if (sortedDays.length === 0) return 0;
    
    // Check if a specific day is requested via query param
    const requestedDay = searchParams.get("day");
    if (requestedDay) {
      const dayIndex = sortedDays.indexOf(requestedDay);
      if (dayIndex !== -1) return dayIndex;
    }
    
    const todayIndex = sortedDays.indexOf(todayKey);
    if (todayIndex !== -1) return todayIndex;

    // Find the closest future day
    const futureIndex = sortedDays.findIndex((d) => d >= todayKey);
    if (futureIndex !== -1) return futureIndex;

    // All days are past, show the last day
    return sortedDays.length - 1;
  }, [sortedDays, todayKey, searchParams]);

  const [mounted, setMounted] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const prevDayIndexRef = useRef<number | null>(null);

  // Initial load sync
  useEffect(() => {
    if (!mounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      
      // If day is not present in URL, set it once quietly
      if (!searchParams.has("day") && sortedDays[currentDayIndex]) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("day", sortedDays[currentDayIndex]);
        router.replace(`/schedule?${params.toString()}`, { scroll: false });
      }
    }
  }, [mounted, searchParams, sortedDays, router, currentDayIndex]);

  // Track animation direction based on derived currentDayIndex change
  useEffect(() => {
    if (mounted) {
      const prev = prevDayIndexRef.current;
      if (prev !== null && currentDayIndex !== prev) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDirection(currentDayIndex > prev ? "right" : "left");
      }
      prevDayIndexRef.current = currentDayIndex;
    }
  }, [currentDayIndex, mounted]);

  // Sync match highlighting from search parameters dynamically
  useEffect(() => {
    if (mounted) {
      const matchId = searchParams.get("match");
      if (matchId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveHighlightId(matchId);
        const timer = setTimeout(() => {
          setActiveHighlightId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, mounted]);

  const goToPrevDay = useCallback(() => {
    if (currentDayIndex > 0) {
      const nextIndex = currentDayIndex - 1;
      const newDay = sortedDays[nextIndex];
      const params = new URLSearchParams(searchParams.toString());
      params.set("day", newDay);
      params.delete("match");
      params.delete("t");
      router.replace(`/schedule?${params.toString()}`, { scroll: false });
    }
  }, [currentDayIndex, sortedDays, router, searchParams]);

  const goToNextDay = useCallback(() => {
    if (currentDayIndex < sortedDays.length - 1) {
      const nextIndex = currentDayIndex + 1;
      const newDay = sortedDays[nextIndex];
      const params = new URLSearchParams(searchParams.toString());
      params.set("day", newDay);
      params.delete("match");
      params.delete("t");
      router.replace(`/schedule?${params.toString()}`, { scroll: false });
    }
  }, [currentDayIndex, sortedDays, router, searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        goToPrevDay();
      } else if (e.key === "ArrowRight") {
        goToNextDay();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollContainerRef.current?.scrollBy({ top: -100, behavior: "smooth" });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollContainerRef.current?.scrollBy({ top: 100, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevDay, goToNextDay]);

  const goToToday = useCallback(() => {
    let todayIndex = sortedDays.indexOf(todayKey);
    if (todayIndex === -1) {
      todayIndex = sortedDays.findIndex((d) => d >= todayKey);
    }
    if (todayIndex === -1) {
      todayIndex = sortedDays.length - 1;
    }

    const todayDay = sortedDays[todayIndex];
    if (todayIndex !== currentDayIndex) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("day", todayDay);
      params.delete("match");
      params.delete("t");
      router.replace(`/schedule?${params.toString()}`, { scroll: false });
    }
  }, [currentDayIndex, sortedDays, todayKey, router, searchParams]);

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (sortedDays.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        No hay partidos programados.
      </div>
    );
  }

  const currentDay = sortedDays[currentDayIndex];

  const relativeLabel = (() => {
    if (currentDay === todayKey) return "Hoy";
    if (currentDay === yesterdayKey) return "Ayer";
    if (currentDay === tomorrowKey) return "Mañana";
    return null;
  })();

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


  return (
    <div className="animate-fade-in-up flex flex-col h-[calc(100dvh-170px)] md:h-[calc(100vh-200px)] min-h-[400px]">
      {/* Day Navigation */}
      <div className="flex-shrink-0 flex items-center justify-between mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 px-4 py-3">
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
          <div className="flex items-center gap-2">
            {relativeLabel && (
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded shadow-sm">
                {relativeLabel}
              </span>
            )}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center min-w-[200px]">
              {displayDay}
            </h2>
            
            <div className="w-8 flex justify-center">
              {currentDay !== todayKey && (
                <Tooltip content="Volver a Hoy" placement="top">
                  <button
                    onClick={goToToday}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all"
                    aria-label="Ir a hoy"
                  >
                    <Calendar size={16} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
          
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
      <div className="relative flex-1 min-h-0 group/schedule">
        {/* Top Gradient Fade */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-[#0a0a0a] to-transparent pointer-events-none z-20 transition-opacity duration-300" />
        
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto scrollbar-hide pt-8 pb-8 px-4 -mx-4"
        >
          <div 
            key={currentDay} 
            className={clsx(
              "space-y-6",
              direction === "right" && "animate-slide-from-right",
              direction === "left" && "animate-slide-from-left",
              !direction && "animate-fast-fade"
            )}
          >
            {sortedHours.length > 0 ? (
              sortedHours.map((hour) => {
                const hourMatches = matchesByHour.get(hour)!;
                return (
                  <div key={hour}>
                    {/* Hour Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                        {hour}
                      </span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                        {hourMatches.length} partido{hourMatches.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Match Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {hourMatches.map((match) => (
                        <ScheduleMatchCard key={match.id} match={match} highlightMatchId={activeHighlightId} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/50 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-tight">
                  Sin partidos
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  No hay encuentros programados para esta fecha. ¡Aprovecha para repasar las posiciones de los grupos o los cruces de eliminatorias!
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent pointer-events-none z-20 transition-opacity duration-300" />
      </div>
    </div>
  );
}

function ScheduleMatchCard({ match, highlightMatchId }: { match: NormalizedMatch; highlightMatchId?: string | null }) {
  const { updateMatch, updateKnockoutMatch } = useTournament();
  const cardRef = useRef<HTMLDivElement>(null);
  const isHighlighted = highlightMatchId === match.id;

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      // Small delay to allow the page to render first
      const timeout = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [isHighlighted]);

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
    <div
      ref={cardRef}
      className={clsx(
        "bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-600",
        isHighlighted && "animate-highlight-match"
      )}
    >      {/* Header: Stage + Status */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {match.isKnockout ? (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {match.stage}
          </span>
        </div>
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
            <FlashScoreInput
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
            <FlashScoreInput
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
