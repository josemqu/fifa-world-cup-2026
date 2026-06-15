"use client";

import { useMemo, useState } from "react";
import { Group, KnockoutMatch, Team } from "@/data/types";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { getTeamAbbreviation } from "@/utils/teamAbbreviations";
import {
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Swords,
  Shield,
  Percent,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────────────────
// Historical World Cup data for comparison
// ──────────────────────────────────────────────────
const HISTORICAL_DATA = [
  { year: 2022, host: "Qatar", matches: 64, goals: 172, gpg: 2.69 },
  { year: 2018, host: "Rusia", matches: 64, goals: 169, gpg: 2.64 },
  { year: 2014, host: "Brasil", matches: 64, goals: 171, gpg: 2.67 },
  { year: 2010, host: "Sudáfrica", matches: 64, goals: 145, gpg: 2.27 },
  { year: 2006, host: "Alemania", matches: 64, goals: 147, gpg: 2.30 },
  { year: 2002, host: "Corea/Japón", matches: 64, goals: 161, gpg: 2.52 },
  { year: 1998, host: "Francia", matches: 64, goals: 171, gpg: 2.67 },
  { year: 1994, host: "EE.UU.", matches: 52, goals: 141, gpg: 2.71 },
  { year: 1990, host: "Italia", matches: 52, goals: 115, gpg: 2.21 },
  { year: 1986, host: "México", matches: 52, goals: 132, gpg: 2.54 },
  { year: 1982, host: "España", matches: 52, goals: 146, gpg: 2.81 },
  { year: 1978, host: "Argentina", matches: 38, goals: 102, gpg: 2.68 },
  { year: 1974, host: "Alemania", matches: 38, goals: 97, gpg: 2.55 },
  { year: 1970, host: "México", matches: 32, goals: 95, gpg: 2.97 },
  { year: 1966, host: "Inglaterra", matches: 32, goals: 89, gpg: 2.78 },
  { year: 1962, host: "Chile", matches: 32, goals: 89, gpg: 2.78 },
  { year: 1958, host: "Suecia", matches: 35, goals: 126, gpg: 3.60 },
  { year: 1954, host: "Suiza", matches: 26, goals: 140, gpg: 5.38 },
  { year: 1950, host: "Brasil", matches: 22, goals: 88, gpg: 4.00 },
  { year: 1938, host: "Francia", matches: 18, goals: 84, gpg: 4.67 },
  { year: 1934, host: "Italia", matches: 17, goals: 70, gpg: 4.12 },
  { year: 1930, host: "Uruguay", matches: 18, goals: 70, gpg: 3.89 },
];

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────
interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  groupPos: number; // Position within their group (1-indexed)
  knockoutRound: string; // Furthest knockout stage reached
  defaultRank: number; // Overall tournament standing index (1-based)
}

interface TournamentStatsCardProps {
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
}

type StandingsSortKey =
  | "pos"
  | "team"
  | "group"
  | "played"
  | "won"
  | "drawn"
  | "lost"
  | "gf"
  | "ga"
  | "gd"
  | "pts"
  | "knockoutRound";

type HistorySortKey = "year" | "host" | "matches" | "goals" | "gpg" | "diff";

// ──────────────────────────────────────────────────
// Utility: Compute standings
// ──────────────────────────────────────────────────
function computeStandings(
  groups: Group[],
  knockoutMatches: KnockoutMatch[]
): TeamStanding[] {
  // Build a map of all teams
  const teamMap = new Map<string, TeamStanding>();

  // Process group stage
  for (const group of groups) {
    // Sort teams within the group to determine position
    const sortedTeams = [...group.teams].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
      if (b.gf !== a.gf) return b.gf - a.gf;
      return b.won - a.won;
    });

    sortedTeams.forEach((team, idx) => {
      teamMap.set(team.id, {
        team,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        gf: team.gf,
        ga: team.ga,
        gd: team.gf - team.ga,
        pts: team.pts,
        groupPos: idx + 1,
        knockoutRound: "Grupos",
        defaultRank: 0,
      });
    });
  }

  // Process knockout matches to add stats
  for (const match of knockoutMatches) {
    if (match.homeScore == null || match.awayScore == null) continue;
    const homeTeam =
      match.homeTeam && !("placeholder" in match.homeTeam)
        ? (match.homeTeam as Team)
        : null;
    const awayTeam =
      match.awayTeam && !("placeholder" in match.awayTeam)
        ? (match.awayTeam as Team)
        : null;

    if (!homeTeam || !awayTeam) continue;

    const homeStanding = teamMap.get(homeTeam.id);
    const awayStanding = teamMap.get(awayTeam.id);

    if (homeStanding) {
      homeStanding.played += 1;
      homeStanding.gf += match.homeScore;
      homeStanding.ga += match.awayScore;
      homeStanding.gd = homeStanding.gf - homeStanding.ga;
      if (match.homeScore > match.awayScore) {
        homeStanding.won += 1;
        homeStanding.pts += 3;
      } else if (match.homeScore === match.awayScore) {
        homeStanding.drawn += 1;
        homeStanding.pts += 1;
      } else {
        homeStanding.lost += 1;
      }
      homeStanding.knockoutRound = getStageLabel(match.stage);
    }

    if (awayStanding) {
      awayStanding.played += 1;
      awayStanding.gf += match.awayScore;
      awayStanding.ga += match.homeScore;
      awayStanding.gd = awayStanding.gf - awayStanding.ga;
      if (match.awayScore > match.homeScore) {
        awayStanding.won += 1;
        awayStanding.pts += 3;
      } else if (match.awayScore === match.homeScore) {
        awayStanding.drawn += 1;
        awayStanding.pts += 1;
      } else {
        awayStanding.lost += 1;
      }
      awayStanding.knockoutRound = getStageLabel(match.stage);
    }
  }

  // Sort overall standings: pts > gd > gf > won
  const standings = Array.from(teamMap.values());
  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.won - a.won;
  });

  // Assign overall defaultRank
  standings.forEach((s, idx) => {
    s.defaultRank = idx + 1;
  });

  return standings;
}

function getStageLabel(stage: string): string {
  switch (stage) {
    case "R32":
      return "32avos";
    case "R16":
      return "Octavos";
    case "QF":
      return "Cuartos";
    case "SF":
      return "Semifinal";
    case "Final":
      return "Final";
    case "3rdPlace":
      return "3er Puesto";
    default:
      return stage;
  }
}

// ──────────────────────────────────────────────────
// Stat KPI Card
// ──────────────────────────────────────────────────
function StatKPI({
  icon: Icon,
  label,
  value,
  subtext,
  color = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "blue" | "emerald" | "amber" | "purple" | "rose" | "cyan";
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      icon: "text-blue-500 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/40",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      icon: "text-emerald-500 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/40",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      icon: "text-amber-500 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/40",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      icon: "text-purple-500 dark:text-purple-400",
      border: "border-purple-100 dark:border-purple-900/40",
    },
    rose: {
      bg: "bg-rose-50 dark:bg-rose-950/30",
      icon: "text-rose-500 dark:text-rose-400",
      border: "border-rose-100 dark:border-rose-900/40",
    },
    cyan: {
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      icon: "text-cyan-500 dark:text-cyan-400",
      border: "border-cyan-100 dark:border-cyan-900/40",
    },
  };

  const c = colorMap[color];

  return (
    <div
      className={clsx(
        "rounded-xl border p-3 flex items-center gap-3 transition-all",
        c.bg,
        c.border
      )}
    >
      <div
        className={clsx(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          c.bg,
          c.icon
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium leading-none mb-0.5">
          {label}
        </div>
        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight tabular-nums">
          {value}
        </div>
        {subtext && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────
export function TournamentStatsCard({
  groups,
  knockoutMatches,
}: TournamentStatsCardProps) {
  const [showStandings, setShowStandings] = useState(false);
  const [showScorers, setShowScorers] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sorting State
  const [standingsSortKey, setStandingsSortKey] = useState<StandingsSortKey>("pos");
  const [standingsSortDir, setStandingsSortDir] = useState<"asc" | "desc">("asc");

  const [historySortKey, setHistorySortKey] = useState<HistorySortKey>("year");
  const [historySortDir, setHistorySortDir] = useState<"asc" | "desc">("desc");

  const stats = useMemo(() => {
    // Collect all goals from group matches
    let totalGroupGoals = 0;
    let groupMatchesPlayed = 0;
    let groupMatchesTotal = 0;
    let draws = 0;
    let homeWins = 0;
    let awayWins = 0;
    let cleanSheets = 0;
    let highestScore = { home: "", away: "", homeGoals: 0, awayGoals: 0, total: 0 };
    let biggestWin = { home: "", away: "", homeGoals: 0, awayGoals: 0, diff: 0 };

    for (const group of groups) {
      for (const match of group.matches) {
        groupMatchesTotal++;
        if (match.homeScore != null && match.awayScore != null) {
          groupMatchesPlayed++;
          const hg = match.homeScore;
          const ag = match.awayScore;
          totalGroupGoals += hg + ag;

          if (hg === ag) draws++;
          else if (hg > ag) homeWins++;
          else awayWins++;

          if (hg === 0 || ag === 0) cleanSheets++;

          if (hg + ag > highestScore.total) {
            const homeTeam = group.teams.find(
              (t) => t.id === match.homeTeamId
            );
            const awayTeam = group.teams.find(
              (t) => t.id === match.awayTeamId
            );
            highestScore = {
              home: homeTeam?.name || match.homeTeamId,
              away: awayTeam?.name || match.awayTeamId,
              homeGoals: hg,
              awayGoals: ag,
              total: hg + ag,
            };
          }

          const diff = Math.abs(hg - ag);
          if (diff > biggestWin.diff) {
            const homeTeam = group.teams.find(
              (t) => t.id === match.homeTeamId
            );
            const awayTeam = group.teams.find(
              (t) => t.id === match.awayTeamId
            );
            biggestWin = {
              home: homeTeam?.name || match.homeTeamId,
              away: awayTeam?.name || match.awayTeamId,
              homeGoals: hg,
              awayGoals: ag,
              diff,
            };
          } else if (diff === biggestWin.diff && diff > 0) {
            if (hg + ag > biggestWin.homeGoals + biggestWin.awayGoals) {
              const homeTeam = group.teams.find(
                (t) => t.id === match.homeTeamId
              );
              const awayTeam = group.teams.find(
                (t) => t.id === match.awayTeamId
              );
              biggestWin = {
                home: homeTeam?.name || match.homeTeamId,
                away: awayTeam?.name || match.awayTeamId,
                homeGoals: hg,
                awayGoals: ag,
                diff,
              };
            }
          }
        }
      }
    }

    // Knockout stats
    let totalKnockoutGoals = 0;
    let knockoutMatchesPlayed = 0;
    let knockoutMatchesTotal = knockoutMatches.length;
    let penaltyShootouts = 0;

    for (const match of knockoutMatches) {
      if (match.homeScore != null && match.awayScore != null) {
        const homeTeam =
          match.homeTeam && !("placeholder" in match.homeTeam)
            ? (match.homeTeam as Team)
            : null;
        const awayTeam =
          match.awayTeam && !("placeholder" in match.awayTeam)
            ? (match.awayTeam as Team)
            : null;

        if (!homeTeam || !awayTeam) continue;

        knockoutMatchesPlayed++;
        totalKnockoutGoals += match.homeScore + match.awayScore;

        if (match.homeScore === 0 || match.awayScore === 0) cleanSheets++;

        if (
          match.homePenalties != null &&
          match.awayPenalties != null &&
          match.homeScore === match.awayScore
        ) {
          penaltyShootouts++;
        }

        if (match.homeScore + match.awayScore > highestScore.total) {
          highestScore = {
            home: homeTeam.name,
            away: awayTeam.name,
            homeGoals: match.homeScore,
            awayGoals: match.awayScore,
            total: match.homeScore + match.awayScore,
          };
        }

        const diff = Math.abs(match.homeScore - match.awayScore);
        if (diff > biggestWin.diff) {
          biggestWin = {
            home: homeTeam.name,
            away: awayTeam.name,
            homeGoals: match.homeScore,
            awayGoals: match.awayScore,
            diff,
          };
        } else if (diff === biggestWin.diff && diff > 0) {
          if (match.homeScore + match.awayScore > biggestWin.homeGoals + biggestWin.awayGoals) {
            biggestWin = {
              home: homeTeam.name,
              away: awayTeam.name,
              homeGoals: match.homeScore,
              awayGoals: match.awayScore,
              diff,
            };
          }
        }

        if (match.homeScore === match.awayScore) draws++;
        else if (match.homeScore > match.awayScore) homeWins++;
        else awayWins++;
      }
    }

    const totalGoals = totalGroupGoals + totalKnockoutGoals;
    const totalMatchesPlayed = groupMatchesPlayed + knockoutMatchesPlayed;
    const totalMatchesAll = groupMatchesTotal + knockoutMatchesTotal;
    const avgGoalsPerMatch =
      totalMatchesPlayed > 0 ? totalGoals / totalMatchesPlayed : 0;

    // Top scorers (team-level)
    const standings = computeStandings(groups, knockoutMatches);
    const topScoringTeam = standings.length > 0 
      ? standings.reduce((best, curr) => curr.gf > best.gf ? curr : best, standings[0])
      : null;
    const bestDefense = standings.length > 0
      ? standings.reduce((best, curr) => curr.ga < best.ga ? curr : best, standings[0])
      : null;

    // Player-level top scorers computation
    const scorersMap = new Map<string, { name: string; team: string; goals: number; penalties: number }>();

    const addScorerObj = (scorer: any, teamName: string) => {
      if (!scorer || scorer.isOwnGoal) return;
      const key = `${scorer.name}_${teamName}`;
      const existing = scorersMap.get(key);
      if (existing) {
        existing.goals += 1;
        if (scorer.isPenalty) existing.penalties += 1;
      } else {
        scorersMap.set(key, {
          name: scorer.name,
          team: teamName,
          goals: 1,
          penalties: scorer.isPenalty ? 1 : 0
        });
      }
    };

    for (const group of groups) {
      for (const match of group.matches) {
        if (match.finished || match.homeScore != null || match.awayScore != null) {
          const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
          const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);
          const homeName = homeTeam?.name || match.homeTeamId;
          const awayName = awayTeam?.name || match.awayTeamId;

          match.homeScorers?.forEach((s) => addScorerObj(s, homeName));
          match.awayScorers?.forEach((s) => addScorerObj(s, awayName));
        }
      }
    }

    for (const match of knockoutMatches) {
      if (match.finished || match.homeScore != null || match.awayScore != null) {
        const homeName = match.homeTeam && !("placeholder" in match.homeTeam) ? (match.homeTeam as Team).name : "";
        const awayName = match.awayTeam && !("placeholder" in match.awayTeam) ? (match.awayTeam as Team).name : "";

        if (homeName) match.homeScorers?.forEach((s) => addScorerObj(s, homeName));
        if (awayName) match.awayScorers?.forEach((s) => addScorerObj(s, awayName));
      }
    }

    const topScorers = Array.from(scorersMap.values()).sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.name.localeCompare(b.name);
    });

    const decidedPct = totalMatchesAll > 0 ? (totalMatchesPlayed / totalMatchesAll) * 100 : 0;

    const historicalRank = HISTORICAL_DATA.filter(
      (h) => avgGoalsPerMatch > h.gpg
    ).length + 1;

    return {
      totalGoals,
      totalGroupGoals,
      totalKnockoutGoals,
      totalMatchesPlayed,
      totalMatchesAll,
      groupMatchesPlayed,
      groupMatchesTotal,
      knockoutMatchesPlayed,
      knockoutMatchesTotal,
      avgGoalsPerMatch,
      draws,
      homeWins,
      awayWins,
      cleanSheets,
      highestScore,
      biggestWin,
      penaltyShootouts,
      topScoringTeam,
      bestDefense,
      decidedPct,
      historicalRank,
      standings,
      topScorers,
    };
  }, [groups, knockoutMatches]);

  // Combined History for Sorting
  const combinedHistory = useMemo(() => {
    const currentTourney = {
      year: 2026,
      host: "EE.UU./MX/CA",
      matches: stats.totalMatchesPlayed,
      goals: stats.totalGoals,
      gpg: stats.avgGoalsPerMatch,
      isCurrent: true,
    };
    
    return [
      currentTourney,
      ...HISTORICAL_DATA.map((h) => ({ ...h, isCurrent: false })),
    ];
  }, [stats.totalMatchesPlayed, stats.totalGoals, stats.avgGoalsPerMatch]);



  // Derived Sorted Standings
  const sortedStandings = useMemo(() => {
    let list = [...stats.standings];

    // Apply sorting
    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (standingsSortKey) {
        case "pos":
          valA = a.defaultRank;
          valB = b.defaultRank;
          break;
        case "team":
          valA = a.team.name;
          valB = b.team.name;
          break;
        case "group":
          valA = a.team.group;
          valB = b.team.group;
          break;
        case "played":
          valA = a.played;
          valB = b.played;
          break;
        case "won":
          valA = a.won;
          valB = b.won;
          break;
        case "drawn":
          valA = a.drawn;
          valB = b.drawn;
          break;
        case "lost":
          valA = a.lost;
          valB = b.lost;
          break;
        case "gf":
          valA = a.gf;
          valB = b.gf;
          break;
        case "ga":
          valA = a.ga;
          valB = b.ga;
          break;
        case "gd":
          valA = a.gd;
          valB = b.gd;
          break;
        case "pts":
          valA = a.pts;
          valB = b.pts;
          break;
        case "knockoutRound":
          const roundOrder: Record<string, number> = {
            "Grupos": 0,
            "32avos": 1,
            "Octavos": 2,
            "Cuartos": 3,
            "Semifinal": 4,
            "3er Puesto": 5,
            "Final": 6,
          };
          valA = roundOrder[a.knockoutRound] ?? -1;
          valB = roundOrder[b.knockoutRound] ?? -1;
          break;
        default:
          valA = a.defaultRank;
          valB = b.defaultRank;
      }

      if (valA < valB) return standingsSortDir === "asc" ? -1 : 1;
      if (valA > valB) return standingsSortDir === "asc" ? 1 : -1;
      
      // Secondary fallback
      return a.defaultRank - b.defaultRank;
    });

    return list;
  }, [stats.standings, standingsSortKey, standingsSortDir]);

  // Derived Sorted History
  const sortedHistory = useMemo(() => {
    let list = [...combinedHistory];

    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (historySortKey) {
        case "year":
          valA = a.year;
          valB = b.year;
          break;
        case "host":
          valA = a.host;
          valB = b.host;
          break;
        case "matches":
          valA = a.matches;
          valB = b.matches;
          break;
        case "goals":
          valA = a.goals;
          valB = b.goals;
          break;
        case "gpg":
          valA = a.gpg;
          valB = b.gpg;
          break;
        case "diff":
          valA = a.gpg;
          valB = b.gpg;
          break;
        default:
          valA = a.year;
          valB = b.year;
      }

      if (valA < valB) return historySortDir === "asc" ? -1 : 1;
      if (valA > valB) return historySortDir === "asc" ? 1 : -1;

      return b.year - a.year;
    });

    return list;
  }, [combinedHistory, historySortKey, historySortDir]);

  // Handlers
  const handleStandingsSort = (key: StandingsSortKey) => {
    if (standingsSortKey === key) {
      setStandingsSortDir(standingsSortDir === "asc" ? "desc" : "asc");
    } else {
      setStandingsSortKey(key);
      setStandingsSortDir(
        ["team", "group", "pos"].includes(key) ? "asc" : "desc"
      );
    }
  };

  const handleHistorySort = (key: HistorySortKey) => {
    if (historySortKey === key) {
      setHistorySortDir(historySortDir === "asc" ? "desc" : "asc");
    } else {
      setHistorySortKey(key);
      setHistorySortDir(key === "host" ? "asc" : "desc");
    }
  };

  const renderStandingsHeader = (
    key: StandingsSortKey,
    label: string,
    align: "left" | "center" = "center",
    widthClass?: string,
    title?: string
  ) => {
    const isActive = standingsSortKey === key;
    return (
      <th
        onClick={() => handleStandingsSort(key)}
        className={clsx(
          "py-1.5 px-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors select-none group",
          align === "center" ? "text-center" : "text-left",
          widthClass
        )}
        title={title}
      >
        <div
          className={clsx(
            "flex items-center gap-0.5",
            align === "center" ? "justify-center" : "justify-start"
          )}
        >
          <span className={clsx(isActive && "text-blue-600 dark:text-blue-400 font-semibold")}>
            {label}
          </span>
          {isActive ? (
            standingsSortDir === "asc" ? (
              <ChevronUp size={11} className="text-blue-500 shrink-0" />
            ) : (
              <ChevronDown size={11} className="text-blue-500 shrink-0" />
            )
          ) : (
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
          )}
        </div>
      </th>
    );
  };

  const renderHistoryHeader = (
    key: HistorySortKey,
    label: string,
    align: "left" | "center" = "center",
    widthClass?: string
  ) => {
    const isActive = historySortKey === key;
    return (
      <th
        onClick={() => handleHistorySort(key)}
        className={clsx(
          "py-1.5 px-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors select-none group",
          align === "center" ? "text-center" : "text-left",
          widthClass
        )}
      >
        <div
          className={clsx(
            "flex items-center gap-0.5",
            align === "center" ? "justify-center" : "justify-start"
          )}
        >
          <span className={clsx(isActive && "text-blue-600 dark:text-blue-400 font-semibold")}>
            {label}
          </span>
          {isActive ? (
            historySortDir === "asc" ? (
              <ChevronUp size={11} className="text-blue-500 shrink-0" />
            ) : (
              <ChevronDown size={11} className="text-blue-500 shrink-0" />
            )
          ) : (
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
          )}
        </div>
      </th>
    );
  };

  if (stats.totalMatchesPlayed === 0) {
    return null; // Nothing to show if no matches played
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/60 dark:to-blue-950/20 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <BarChart3 size={15} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Estadísticas del Torneo
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {stats.totalMatchesPlayed} de {stats.totalMatchesAll} partidos
              jugados ({stats.decidedPct.toFixed(0)}%)
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${stats.decidedPct}%` }}
          />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <StatKPI
          icon={Target}
          label="Goles totales"
          value={stats.totalGoals}
          subtext={`Grupos: ${stats.totalGroupGoals} · Llaves: ${stats.totalKnockoutGoals}`}
          color="blue"
        />
        <StatKPI
          icon={TrendingUp}
          label="Promedio x partido"
          value={stats.avgGoalsPerMatch.toFixed(2)}
          subtext={`Ranking hist.: #${stats.historicalRank} de ${HISTORICAL_DATA.length + 1}`}
          color="emerald"
        />
        <StatKPI
          icon={Swords}
          label="Partido con más goles"
          value={
            stats.highestScore.total > 0
              ? `${stats.highestScore.homeGoals}-${stats.highestScore.awayGoals}`
              : "—"
          }
          subtext={
            stats.highestScore.total > 0
              ? `${getTeamAbbreviation(stats.highestScore.home)} vs ${getTeamAbbreviation(stats.highestScore.away)}`
              : undefined
          }
          color="amber"
        />
        <StatKPI
          icon={Zap}
          label="Mayor goleada"
          value={
            stats.biggestWin.diff > 0
              ? `${stats.biggestWin.homeGoals}-${stats.biggestWin.awayGoals}`
              : "—"
          }
          subtext={
            stats.biggestWin.diff > 0
              ? `${getTeamAbbreviation(stats.biggestWin.home)} vs ${getTeamAbbreviation(stats.biggestWin.away)}`
              : undefined
          }
          color="rose"
        />
        <StatKPI
          icon={Shield}
          label="Vallas invictas"
          value={stats.cleanSheets}
          subtext={
            stats.totalMatchesPlayed > 0
              ? `${((stats.cleanSheets / (stats.totalMatchesPlayed * 2)) * 100).toFixed(0)}% de las actuaciones`
              : undefined
          }
          color="cyan"
        />
        <StatKPI
          icon={Percent}
          label="Partidos con penales"
          value={stats.penaltyShootouts}
          subtext={
            stats.knockoutMatchesPlayed > 0
              ? `de ${stats.knockoutMatchesPlayed} partidos de llaves`
              : "Aún sin llaves jugadas"
          }
          color="purple"
        />
        {stats.topScoringTeam && (
          <StatKPI
            icon={Trophy}
            label="Equipo más goleador"
            value={`${stats.topScoringTeam.team.name} (${stats.topScoringTeam.gf})`}
            subtext={`${stats.topScoringTeam.played} PJ`}
            color="amber"
          />
        )}
        {stats.bestDefense && (
          <StatKPI
            icon={Shield}
            label="Mejor defensa"
            value={`${stats.bestDefense.team.name} (${stats.bestDefense.ga})`}
            subtext={`${stats.bestDefense.played} PJ`}
            color="emerald"
          />
        )}
      </div>

      {/* Expandable: General Standings Table */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowStandings(!showStandings)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Trophy size={13} className="text-blue-500" />
            Tabla General de Puntos
          </span>
          {showStandings ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
        <AnimatePresence>
          {showStandings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >


              <div className="overflow-x-auto px-4 pb-4">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                    <tr>
                      {renderStandingsHeader("pos", "#", "center", "w-8")}
                      {renderStandingsHeader("team", "Equipo", "left")}
                      {renderStandingsHeader("group", "Gr", "center", "w-8", "Grupo")}
                      {renderStandingsHeader("played", "PJ", "center", "w-8", "Partidos Jugados")}
                      {renderStandingsHeader("won", "G", "center", "w-8", "Ganados")}
                      {renderStandingsHeader("drawn", "E", "center", "w-8", "Empatados")}
                      {renderStandingsHeader("lost", "P", "center", "w-8", "Perdidos")}
                      {renderStandingsHeader("gf", "GF", "center", "w-10", "Goles a Favor")}
                      {renderStandingsHeader("ga", "GC", "center", "w-10", "Goles en Contra")}
                      {renderStandingsHeader("gd", "DG", "center", "w-10", "Diferencia de Goles")}
                      {renderStandingsHeader("pts", "Pts", "center", "w-10", "Puntos")}
                      <th
                        onClick={() => handleStandingsSort("knockoutRound")}
                        className="py-1.5 px-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors select-none group hidden sm:table-cell text-center w-20"
                        title="Máxima Ronda"
                      >
                        <div className="flex items-center justify-center gap-0.5">
                          <span className={clsx(standingsSortKey === "knockoutRound" && "text-blue-600 dark:text-blue-400 font-semibold")}>
                            Ronda
                          </span>
                          {standingsSortKey === "knockoutRound" ? (
                            standingsSortDir === "asc" ? (
                              <ChevronUp size={11} className="text-blue-500 shrink-0" />
                            ) : (
                              <ChevronDown size={11} className="text-blue-500 shrink-0" />
                            )
                          ) : (
                            <ChevronDown size={11} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStandings.map((s) => (
                      <tr
                        key={s.team.id}
                        className={clsx(
                          "border-b border-slate-100 dark:border-slate-700/50 last:border-none hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors",
                          s.defaultRank <= 3 && "bg-amber-50/20 dark:bg-amber-900/5"
                        )}
                      >
                        <td className="px-1 py-1 text-center text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                          {s.defaultRank}
                        </td>
                        <td className="px-2 py-1 font-medium text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-1.5">
                            <TeamFlag
                              teamName={s.team.name}
                              className="w-4 h-3 shrink-0"
                            />
                            <span className="hidden md:inline truncate max-w-[150px]" title={s.team.name}>
                              {s.team.name}
                            </span>
                            <span className="md:hidden truncate max-w-[85px]" title={s.team.name}>
                              {getTeamAbbreviation(s.team.name)}
                            </span>
                          </div>
                        </td>
                        <td className="px-1 py-1 text-center text-slate-400 dark:text-slate-500 text-[10px] font-mono">
                          {s.team.group}
                        </td>
                        <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                          {s.played}
                        </td>
                        <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                          {s.won}
                        </td>
                        <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                          {s.drawn}
                        </td>
                        <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                          {s.lost}
                        </td>
                        <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                          {s.gf}
                        </td>
                        <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                          {s.ga}
                        </td>
                        <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400 font-medium">
                          {s.gd > 0 ? `+${s.gd}` : s.gd}
                        </td>
                        <td className="px-1 py-1 text-center font-bold text-slate-800 dark:text-slate-100">
                          {s.pts}
                        </td>
                        <td className="px-1 py-1 text-center text-[10px] text-slate-400 dark:text-slate-500 hidden sm:table-cell">
                          <span
                            className={clsx(
                              "px-1.5 py-0.5 rounded-full text-[9px] font-medium inline-block",
                              s.knockoutRound === "Final"
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                : s.knockoutRound === "Semifinal"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                : s.knockoutRound === "Cuartos"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                  : s.knockoutRound === "Octavos"
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {s.knockoutRound}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable: Top Scorers (Goleadores) */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowScorers(!showScorers)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Target size={13} className="text-rose-500" />
            Goleadores del Torneo
          </span>
          {showScorers ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
        <AnimatePresence>
          {showScorers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {stats.topScorers.length === 0 ? (
                  <div className="text-center text-slate-400 py-6 text-xs italic">
                    Aún no se han registrado goles en el torneo.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="py-1.5 px-2 text-center w-10">#</th>
                          <th className="py-1.5 px-2">Jugador</th>
                          <th className="py-1.5 px-2">Equipo</th>
                          <th className="py-1.5 px-2 text-center w-16">Goles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let currentRank = 0;
                          let prevGoals = -1;
                          return stats.topScorers.map((s, idx) => {
                            if (s.goals !== prevGoals) {
                              currentRank = idx + 1;
                              prevGoals = s.goals;
                            }
                            
                            const medal = 
                              currentRank === 1 ? "🥇" :
                              currentRank === 2 ? "🥈" :
                              currentRank === 3 ? "🥉" :
                              String(currentRank);

                            return (
                              <tr
                                key={`${s.name}_${s.team}`}
                                className="border-b border-slate-100 dark:border-slate-700/50 last:border-none hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <td className="px-2 py-1.5 text-center font-bold text-slate-500 dark:text-slate-400">
                                  {medal}
                                </td>
                                <td className="px-2 py-1.5 font-semibold text-slate-900 dark:text-slate-100">
                                  {s.name}
                                </td>
                                <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300">
                                  <div className="flex items-center gap-1.5">
                                    <TeamFlag teamName={s.team} className="w-4 h-3 shrink-0" />
                                    <span>{s.team}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5 text-center font-bold text-slate-800 dark:text-slate-100 font-mono">
                                  <span className="flex items-center justify-center gap-1">
                                    <span>⚽</span>
                                    <span>{s.goals}</span>
                                    {s.penalties > 0 && (
                                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal normal-case">
                                        ({s.penalties} p.)
                                      </span>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable: Historical Comparison */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <BarChart3 size={13} className="text-emerald-500" />
            Comparación Histórica (Goles x Partido)
          </span>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto px-4 pb-4">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      {renderHistoryHeader("year", "Edición", "left")}
                      {renderHistoryHeader("host", "Sede", "left")}
                      {renderHistoryHeader("matches", "Partidos", "center")}
                      {renderHistoryHeader("goals", "Goles", "center")}
                      {renderHistoryHeader("gpg", "GPP", "center")}
                      {renderHistoryHeader("diff", "vs 2026", "center")}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map((h) => {
                      const diff = stats.avgGoalsPerMatch - h.gpg;
                      return (
                        <tr
                          key={h.year}
                          className={clsx(
                            "border-b border-slate-100 dark:border-slate-700/50 last:border-none hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors",
                            h.isCurrent && "bg-blue-50/50 dark:bg-blue-950/20 border-b-2 border-blue-200 dark:border-blue-800/40 font-semibold"
                          )}
                        >
                          <td className={clsx("px-2 py-1 text-slate-700 dark:text-slate-300 font-medium", h.isCurrent && "text-blue-700 dark:text-blue-300")}>
                            {h.year}
                          </td>
                          <td className={clsx("px-2 py-1 text-slate-500 dark:text-slate-400", h.isCurrent && "text-blue-600 dark:text-blue-400")}>
                            {h.host}
                          </td>
                          <td className={clsx("px-1 py-1 text-center text-slate-600 dark:text-slate-400", h.isCurrent && "text-blue-700 dark:text-blue-300")}>
                            {h.matches}
                          </td>
                          <td className={clsx("px-1 py-1 text-center text-slate-600 dark:text-slate-400", h.isCurrent && "text-blue-700 dark:text-blue-300")}>
                            {h.goals}
                          </td>
                          <td className={clsx("px-1 py-1 text-center text-slate-600 dark:text-slate-400 font-mono", h.isCurrent && "text-blue-700 dark:text-blue-300 font-bold")}>
                            {h.gpg.toFixed(2)}
                          </td>
                          <td className="px-1 py-1 text-center font-mono text-[10px]">
                            {h.isCurrent ? (
                              "—"
                            ) : stats.totalMatchesPlayed > 0 ? (
                              <span
                                className={clsx(
                                  diff > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : diff < 0
                                    ? "text-red-500 dark:text-red-400"
                                    : "text-slate-400"
                                )}
                              >
                                {diff > 0 ? "+" : ""}
                                {diff.toFixed(2)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

