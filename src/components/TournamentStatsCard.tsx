"use client";

import { useMemo, useState } from "react";
import { Group, KnockoutMatch, Team, Scorer } from "@/data/types";
import { sortGroupTeams } from "@/utils/groupSorting";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { getTeamAbbreviation } from "@/utils/teamAbbreviations";
import { useTopScorers, TopScorer } from "@/hooks/useTopScorers";
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
  Loader2,
  Search,
  X,
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
// Historical Top Scorers (Goleadores Históricos)
// ──────────────────────────────────────────────────
interface HistoricalScorer {
  name: string;
  team: string;
  goals: number;
  matches: number;
  years: string;
}

const HISTORICAL_SCORERS: HistoricalScorer[] = [
  { name: "Miroslav Klose", team: "Alemania", goals: 16, matches: 24, years: "2002–2014" },
  { name: "Ronaldo Nazário", team: "Brasil", goals: 15, matches: 19, years: "1998–2006" },
  { name: "Gerd Müller", team: "Alemania Fed.", goals: 14, matches: 13, years: "1970–1974" },
  { name: "Just Fontaine", team: "Francia", goals: 13, matches: 6, years: "1958" },
  { name: "Lionel Messi", team: "Argentina", goals: 13, matches: 26, years: "2006–2022" },
  { name: "Pelé", team: "Brasil", goals: 12, matches: 14, years: "1958–1970" },
  { name: "Kylian Mbappé", team: "Francia", goals: 12, matches: 14, years: "2018–2022" },
  { name: "Sándor Kocsis", team: "Hungría", goals: 11, matches: 5, years: "1954" },
  { name: "Jürgen Klinsmann", team: "Alemania", goals: 11, matches: 17, years: "1990–1998" },
  { name: "Helmut Rahn", team: "Alemania Fed.", goals: 10, matches: 10, years: "1954–1958" },
  { name: "Gary Lineker", team: "Inglaterra", goals: 10, matches: 12, years: "1986–1990" },
  { name: "Gabriel Batistuta", team: "Argentina", goals: 10, matches: 12, years: "1994–2002" },
  { name: "Teófilo Cubillas", team: "Perú", goals: 10, matches: 13, years: "1970–1978" },
  { name: "Thomas Müller", team: "Alemania", goals: 10, matches: 19, years: "2010–2022" },
  { name: "Grzegorz Lato", team: "Polonia", goals: 10, matches: 20, years: "1974–1982" },
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
    // Sort teams within the group to determine position using Olympic tiebreaker
    const sortedTeams = sortGroupTeams(group.teams, group.matches);

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
      return "16avos";
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
  const [activeTab, setActiveTab] = useState<"standings" | "scorers" | "history">("standings");
  const [scorersTab, setScorersTab] = useState<"current" | "historical">("current");
  const [standingsSearch, setStandingsSearch] = useState("");
  const [showAllStandings, setShowAllStandings] = useState(false);

  // Sorting State
  const [standingsSortKey, setStandingsSortKey] = useState<StandingsSortKey>("pos");
  const [standingsSortDir, setStandingsSortDir] = useState<"asc" | "desc">("asc");

  const [historySortKey, setHistorySortKey] = useState<HistorySortKey>("year");
  const [historySortDir, setHistorySortDir] = useState<"asc" | "desc">("desc");

  // Backend-powered top scorers (primary data source)
  const { topScorers: backendScorers, isLoading: scorersLoading, meta: scorersMeta } = useTopScorers();

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
    const knockoutMatchesTotal = knockoutMatches.length;
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

    const addScorerObj = (scorer: Scorer, teamName: string) => {
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
      topScorersLocal: topScorers,
    };
  }, [groups, knockoutMatches]);

  // Use backend scorers as primary, fall back to local computation
  const effectiveScorers = useMemo(() => {
    // Backend has data → use it
    if (backendScorers.length > 0) {
      return backendScorers.map((s: TopScorer) => ({
        name: s.name,
        team: s.team,
        goals: s.goals,
        penalties: s.penalties,
      }));
    }
    // Fallback to local computation
    return stats.topScorersLocal;
  }, [backendScorers, stats.topScorersLocal]);

  // Derived Historical Scorers updated with 2026 goals
  const updatedHistoricalScorers = useMemo(() => {
    const list = HISTORICAL_SCORERS.map((hs) => {
      const currentScorer = effectiveScorers.find(
        (s) => s.name.toLowerCase().trim() === hs.name.toLowerCase().trim()
      );

      if (currentScorer) {
        const teamStanding = stats.standings.find(
          (st) => st.team.name.toLowerCase().trim() === hs.team.toLowerCase().trim()
        );
        const currentMatches = teamStanding ? teamStanding.played : 0;
        
        return {
          ...hs,
          goals: hs.goals + currentScorer.goals,
          matches: hs.matches + currentMatches,
          years: hs.years.endsWith("2026") ? hs.years : `${hs.years.split("–")[0]}–2026`,
        };
      }
      return hs;
    });

    list.sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.matches - b.matches;
    });

    return list;
  }, [effectiveScorers, stats.standings]);

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

    // Apply search filter
    if (standingsSearch.trim()) {
      const query = standingsSearch.toLowerCase().trim();
      list = list.filter((s) => s.team.name.toLowerCase().includes(query));
    }

    // Apply sorting
    list.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

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
            "16avos": 1,
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
  }, [stats.standings, standingsSortKey, standingsSortDir, standingsSearch]);

  // Derived Sorted History
  const sortedHistory = useMemo(() => {
    const list = [...combinedHistory];

    list.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

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
          widthClass,
          isActive && "bg-blue-500/[0.04] dark:bg-blue-400/[0.02]"
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

    // ──────────────────────────────────────────────────
  // Tab Renderers
  // ──────────────────────────────────────────────────

  const renderStandingsTab = () => {
    const displayedStandings = showAllStandings
      ? sortedStandings
      : sortedStandings.slice(0, 12);

    return (
      <div className="max-w-5xl mx-auto">
        {/* Search & Stats Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4 px-1">
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar selección..."
              value={standingsSearch}
              onChange={(e) => {
                setStandingsSearch(e.target.value);
                setShowAllStandings(true); // Auto-expand when searching
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
            {standingsSearch && (
              <button
                onClick={() => setStandingsSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono self-end sm:self-center">
            {sortedStandings.length === 0 ? "Sin resultados" : `Mostrando ${sortedStandings.length} de ${stats.standings.length} equipos`}
          </div>
        </div>

        {/* Scrollable standig table container */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm bg-white dark:bg-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0">
              <tr>
                {renderStandingsHeader("pos", "#", "center", "w-10")}
                {renderStandingsHeader("team", "Equipo", "left")}
                {renderStandingsHeader("group", "Gr", "center", "w-10", "Grupo")}
                {renderStandingsHeader("played", "PJ", "center", "w-10", "Partidos Jugados")}
                {renderStandingsHeader("won", "G", "center", "w-10", "Ganados")}
                {renderStandingsHeader("drawn", "E", "center", "w-10", "Empatados")}
                {renderStandingsHeader("lost", "P", "center", "w-10", "Perdidos")}
                {renderStandingsHeader("gf", "GF", "center", "w-12", "Goles a Favor")}
                {renderStandingsHeader("ga", "GC", "center", "w-12", "Goles en Contra")}
                {renderStandingsHeader("gd", "DG", "center", "w-12", "Diferencia de Goles")}
                {renderStandingsHeader("pts", "Pts", "center", "w-12", "Puntos")}
                <th
                  onClick={() => handleStandingsSort("knockoutRound")}
                  className={clsx(
                    "py-1.5 px-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors select-none group hidden sm:table-cell text-center w-24",
                    standingsSortKey === "knockoutRound" && "bg-blue-500/[0.04] dark:bg-blue-400/[0.02]"
                  )}
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
              {displayedStandings.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center text-slate-400 dark:text-slate-500 py-8 italic">
                    No se encontraron selecciones con ese nombre.
                  </td>
                </tr>
              ) : (
                displayedStandings.map((s) => {
                  const isTop1 = s.defaultRank === 1;
                  const isTop2 = s.defaultRank === 2;
                  const isTop3 = s.defaultRank === 3;

                  return (
                    <tr
                      key={s.team.id}
                      className={clsx(
                        "border-b border-slate-100 dark:border-slate-800/60 last:border-none hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                        isTop1 && "bg-amber-500/[0.04] dark:bg-amber-500/[0.02]",
                        isTop2 && "bg-slate-400/[0.04] dark:bg-slate-400/[0.02]",
                        isTop3 && "bg-amber-700/[0.04] dark:bg-amber-700/[0.02]"
                      )}
                    >
                      <td className={clsx(
                        "px-2 py-2 text-center font-mono text-[10px] font-semibold transition-colors",
                        standingsSortKey === "pos" && "bg-blue-500/[0.04] dark:bg-blue-400/[0.02]",
                        isTop1 && "text-amber-600 dark:text-amber-400",
                        isTop2 && "text-slate-500 dark:text-slate-400",
                        isTop3 && "text-amber-800 dark:text-amber-600",
                        !isTop1 && !isTop2 && !isTop3 && "text-slate-400 dark:text-slate-500"
                      )}>
                        {s.defaultRank}
                      </td>
                      <td className={clsx(
                        "px-3 py-2 font-medium transition-colors",
                        standingsSortKey === "team" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-900 dark:text-slate-100"
                      )}>
                        <div className="flex items-center gap-2">
                          <TeamFlag
                            teamName={s.team.name}
                            className="w-4 h-3 rounded-sm shrink-0 shadow-sm"
                          />
                          <span className="hidden md:inline truncate max-w-[165px]" title={s.team.name}>
                            {s.team.name}
                          </span>
                          <span className="md:hidden truncate max-w-[85px]" title={s.team.name}>
                            {getTeamAbbreviation(s.team.name)}
                          </span>
                        </div>
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center text-[10px] font-mono transition-colors",
                        standingsSortKey === "group" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {s.team.group}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center font-medium transition-colors",
                        standingsSortKey === "played" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {s.played}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center transition-colors",
                        standingsSortKey === "won" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {s.won}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center transition-colors",
                        standingsSortKey === "drawn" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {s.drawn}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center transition-colors",
                        standingsSortKey === "lost" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {s.lost}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center font-mono transition-colors",
                        standingsSortKey === "gf" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {s.gf}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center font-mono transition-colors",
                        standingsSortKey === "ga" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02] text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {s.ga}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center font-mono font-medium transition-colors",
                        standingsSortKey === "gd" && "bg-blue-500/[0.04] dark:bg-blue-400/[0.02]",
                        s.gd > 0 ? "text-emerald-600 dark:text-emerald-400" : s.gd < 0 ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {s.gd > 0 ? `+${s.gd}` : s.gd}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center font-mono transition-colors",
                        standingsSortKey === "pts"
                          ? "font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/[0.06] dark:bg-blue-400/[0.03]"
                          : "font-extrabold text-slate-800 dark:text-slate-100 bg-slate-50/[0.3] dark:bg-slate-800/10"
                      )}>
                        {s.pts}
                      </td>
                      <td className={clsx(
                        "px-2 py-2 text-center text-[10px] hidden sm:table-cell transition-colors",
                        standingsSortKey === "knockoutRound" ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.02]" : "text-slate-400 dark:text-slate-500"
                      )}>
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[9px] font-semibold inline-block shadow-sm",
                            s.knockoutRound === "Final"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50"
                              : s.knockoutRound === "Semifinal"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50"
                              : s.knockoutRound === "Cuartos"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50"
                                : s.knockoutRound === "Octavos"
                                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/50"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/20 dark:border-slate-700/50"
                          )}
                        >
                          {s.knockoutRound}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expand / Collapse Button */}
        {!standingsSearch && sortedStandings.length > 12 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAllStandings(!showAllStandings)}
              className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50 cursor-pointer select-none"
            >
              {showAllStandings ? "Ver menos posiciones" : `Ver todas las posiciones (${sortedStandings.length})`}
              {showAllStandings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentScorers = () => {
    if (effectiveScorers.length === 0) {
      return (
        <div className="text-center text-slate-400 py-12 text-xs italic bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm max-w-2xl mx-auto">
          {scorersLoading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span>Cargando goleadores en vivo...</span>
            </div>
          ) : (
            "Aún no se han registrado goles en el torneo."
          )}
        </div>
      );
    }

    // Rank scorers sequentially handling ties
    let currentRank = 1;
    let prevGoals = -1;
    const rankedScorers = effectiveScorers.map((s, idx) => {
      if (idx > 0 && s.goals < prevGoals) {
        currentRank++;
      }
      prevGoals = s.goals;
      return { ...s, rank: currentRank };
    });

    const firstScorers = rankedScorers.filter((s) => s.rank === 1);
    const secondScorers = rankedScorers.filter((s) => s.rank === 2);
    const thirdScorers = rankedScorers.filter((s) => s.rank === 3);
    const restScorers = rankedScorers.filter((s) => s.rank > 3).slice(0, 20);

    const renderPodiumCard = (
      rank: 1 | 2 | 3,
      players: typeof rankedScorers
    ) => {
      if (players.length === 0) return null;

      const config = {
        1: {
          cardClass: "bg-gradient-to-b from-amber-500/[0.12] to-transparent border border-amber-500/25 w-[130px] sm:w-[190px] shadow-md shadow-amber-500/[0.03] z-10 h-auto mt-0",
          badgeClass: "absolute -top-4 bg-amber-500 text-white w-8 h-8 text-sm border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center font-black shadow-lg animate-pulse",
          badgeText: "🏆",
          avatarClass: "w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border border-amber-300 dark:border-amber-800 shadow-md mb-2 shrink-0",
          flagClass: "w-6 h-4 rounded-sm",
          nameClass: "text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 text-center truncate w-full",
          teamClass: "text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-semibold truncate w-full text-center mt-0.5",
          goalsClass: "mt-2.5 text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/45 px-2.5 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-900/50 shadow-sm font-mono flex items-center gap-0.5 shrink-0",
          contentClass: "flex flex-col items-center justify-center w-full"
        },
        2: {
          cardClass: "bg-gradient-to-b from-slate-400/[0.08] to-transparent border border-slate-400/20 w-[120px] sm:w-[170px] shadow-sm h-auto mt-4 sm:mt-6",
          badgeClass: "absolute -top-3 bg-slate-400 text-white w-6 h-6 text-[10px] border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center font-black shadow-md",
          badgeText: "2",
          avatarClass: "w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner mb-2 shrink-0",
          flagClass: "w-5 h-3.5 rounded-sm",
          nameClass: "text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 text-center truncate w-full",
          teamClass: "text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-center mt-0.5",
          goalsClass: "mt-2 text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm font-mono flex items-center gap-0.5 shrink-0",
          contentClass: "flex flex-col items-center justify-center w-full"
        },
        3: {
          cardClass: "bg-gradient-to-b from-amber-700/[0.08] to-transparent border border-amber-700/20 w-[120px] sm:w-[170px] shadow-sm h-auto mt-8 sm:mt-12",
          badgeClass: "absolute -top-3 bg-amber-700 text-white w-6 h-6 text-[10px] border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center font-black shadow-md",
          badgeText: "3",
          avatarClass: "w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner mb-2 shrink-0",
          flagClass: "w-5 h-3.5 rounded-sm",
          nameClass: "text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 text-center truncate w-full",
          teamClass: "text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-center mt-0.5",
          goalsClass: "mt-2 text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm font-mono flex items-center gap-0.5 shrink-0",
          contentClass: "flex flex-col items-center justify-center w-full"
        }
      }[rank];

      const isMultiple = players.length > 1;

      return (
        <div className={clsx("flex flex-col items-center rounded-2xl p-3 sm:p-4 shadow-sm relative justify-start", config.cardClass)}>
          <div className={config.badgeClass}>
            {config.badgeText}
          </div>

          <div className={config.contentClass}>
            {!isMultiple ? (
              <>
                <div className={config.avatarClass}>
                  <TeamFlag teamName={players[0].team} className={config.flagClass} />
                </div>
                <div className={config.nameClass} title={players[0].name}>
                  {players[0].name}
                </div>
                <div className={config.teamClass}>
                  {players[0].team}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full my-2">
                {players.slice(0, 3).map((p, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-1.5 w-full text-left px-1 justify-start min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner shrink-0">
                      <TeamFlag teamName={p.team} className="w-3.5 h-2.5 rounded-sm" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[10px] sm:text-xs font-bold truncate leading-tight text-slate-800 dark:text-slate-100" title={p.name}>
                        {p.name}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
                        {p.team}
                      </span>
                    </div>
                  </div>
                ))}
                {players.length > 3 && (
                  <div className="text-[9px] sm:text-[10px] text-center font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    + {players.length - 3} más
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={config.goalsClass}>
            <span>⚽</span>
            <span>{players[0].goals}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Source metadata indicators */}
        {scorersMeta && (
          <div className="flex items-center justify-between px-1 text-[9px] text-slate-400 dark:text-slate-500 max-w-2xl mx-auto">
            <span>
              {scorersMeta.totalGoals} goles en {scorersMeta.totalMatches} partidos
              {scorersMeta.totalOwnGoals > 0 && ` (${scorersMeta.totalOwnGoals} en contra)`}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado en vivo
            </span>
          </div>
        )}

        {/* Visual Podium for Top 3 */}
        {(firstScorers.length > 0 || secondScorers.length > 0 || thirdScorers.length > 0) && (
          <div className="flex items-start justify-center gap-2 sm:gap-4 py-4 px-1 max-w-2xl mx-auto">
            {secondScorers.length > 0 && renderPodiumCard(2, secondScorers)}
            {firstScorers.length > 0 && renderPodiumCard(1, firstScorers)}
            {thirdScorers.length > 0 && renderPodiumCard(3, thirdScorers)}
          </div>
        )}


        {/* Secondary Scorers List */}
        {restScorers.length > 0 && (
          <div className="max-w-2xl mx-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="text-[10px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3 text-center w-12">#</th>
                  <th className="py-2 px-3">Jugador</th>
                  <th className="py-2 px-3">Equipo</th>
                  <th className="py-2 px-3 text-center w-24">Goles</th>
                </tr>
              </thead>
              <tbody>
                {restScorers.map((s, idx) => (
                  <tr
                    key={`${s.name}_${s.team}_${idx}`}
                    className="border-b border-slate-100 dark:border-slate-800/60 last:border-none hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-center font-bold text-slate-400 dark:text-slate-500">
                      {s.rank}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-900 dark:text-slate-100">
                      {s.name}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700 dark:text-slate-350">
                      <div className="flex items-center gap-2">
                        <TeamFlag teamName={s.team} className="w-4 h-3 rounded-sm shadow-sm" />
                        <span>{s.team}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-center font-bold text-slate-800 dark:text-slate-100 font-mono">
                      <span className="inline-flex items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                        <span>⚽ {s.goals}</span>
                        {s.penalties > 0 && (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">
                            ({s.penalties} p.)
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderHistoricalScorers = () => {
    let currentRank = 1;
    let prevGoals = -1;
    const rankedHistoricalScorers = updatedHistoricalScorers.map((s, idx) => {
      if (idx > 0 && s.goals < prevGoals) {
        currentRank++;
      }
      prevGoals = s.goals;
      return { ...s, rank: currentRank };
    });

    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="text-[10px] text-slate-400 dark:text-slate-500 px-1 italic">
          Máximos anotadores históricos en la historia de la Copa Mundial de la FIFA.
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3 text-center w-12">Pos</th>
                <th className="py-2 px-3">Jugador</th>
                <th className="py-2 px-3">Selección</th>
                <th className="py-2 px-2 text-center w-14">PJ</th>
                <th className="py-2 px-3 text-center w-20">Goles</th>
                <th className="py-2 px-2 text-center w-16">Prom</th>
              </tr>
            </thead>
            <tbody>
              {rankedHistoricalScorers.map((s, idx) => {
                const rank = s.rank;
                const medal =
                  rank === 1 ? "🥇" :
                  rank === 2 ? "🥈" :
                  rank === 3 ? "🥉" :
                  String(rank);
                
                const avg = s.goals / s.matches;
 
                return (
                  <tr
                    key={`${s.name}_${s.team}`}
                    className={clsx(
                      "border-b border-slate-100 dark:border-slate-800/60 last:border-none hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                      rank === 1 && "bg-amber-500/[0.03] dark:bg-amber-500/[0.01]",
                      rank === 2 && "bg-slate-400/[0.03] dark:bg-slate-400/[0.01]",
                      rank === 3 && "bg-amber-700/[0.03] dark:bg-amber-700/[0.01]"
                    )}
                  >
                    <td className="px-3 py-2 text-center font-bold text-slate-500 dark:text-slate-400">
                      {medal}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500">{s.years}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-350 font-medium">
                      <div className="flex items-center gap-2">
                        <TeamFlag teamName={s.team} className="w-4 h-3 rounded-sm shadow-sm" />
                        <span>{s.team}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-slate-500 dark:text-slate-400 font-mono">
                      {s.matches}
                    </td>
                    <td className="px-3 py-2 text-center font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                      ⚽ {s.goals}
                    </td>
                    <td className="px-2 py-2 text-center text-slate-500 dark:text-slate-500 font-mono text-[11px]">
                      {avg.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderScorersTab = () => {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Toggle sub-pestañas: 2026 vs Todos los Tiempos */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex p-0.5 bg-slate-100/90 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
            <button
              onClick={() => setScorersTab("current")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[10px] font-extrabold transition-all duration-200 cursor-pointer select-none",
                scorersTab === "current"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Mundial 2026
            </button>
            <button
              onClick={() => setScorersTab("historical")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[10px] font-extrabold transition-all duration-200 cursor-pointer select-none",
                scorersTab === "historical"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Todos los Tiempos
            </button>
          </div>
        </div>

        {scorersTab === "current" ? renderCurrentScorers() : renderHistoricalScorers()}
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm bg-white dark:bg-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0">
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
                const diff = h.gpg - stats.avgGoalsPerMatch;
                return (
                  <tr
                    key={h.year}
                    className={clsx(
                      "border-b border-slate-100 dark:border-slate-800/60 last:border-none hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                      h.isCurrent && "bg-blue-500/[0.06] dark:bg-blue-500/[0.04] border-b border-blue-200 dark:border-blue-800/50 font-bold"
                    )}
                  >
                    <td className={clsx("px-3 py-2 font-semibold", h.isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-350")}>
                      {h.year} {h.isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 ml-1 border border-blue-200/50 dark:border-blue-900/50 font-normal">Actual</span>}
                    </td>
                    <td className={clsx("px-3 py-2", h.isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400")}>
                      {h.host}
                    </td>
                    <td className={clsx("px-2 py-2 text-center font-mono", h.isCurrent ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400")}>
                      {h.matches}
                    </td>
                    <td className={clsx("px-2 py-2 text-center font-mono", h.isCurrent ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400")}>
                      {h.goals}
                    </td>
                    <td className={clsx("px-2 py-2 text-center font-mono", h.isCurrent ? "text-blue-700 dark:text-blue-300 font-extrabold" : "text-slate-700 dark:text-slate-400 font-medium")}>
                      {h.gpg.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-[10px]">
                      {h.isCurrent ? (
                        "—"
                      ) : stats.totalMatchesPlayed > 0 ? (
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded-md font-bold inline-block shadow-sm",
                            diff > 0
                              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/20"
                              : diff < 0
                              ? "text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/30 dark:border-rose-900/20"
                              : "text-slate-500 bg-slate-100 dark:bg-slate-800"
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
      </div>
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

      {/* Tabs Navigation */}
      <div className="flex border-t border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-1 gap-1 overflow-x-auto select-none scrollbar-none">
        <button
          onClick={() => setActiveTab("standings")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none",
            activeTab === "standings"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
          )}
        >
          <Trophy size={14} className={clsx(activeTab === "standings" ? "text-blue-500" : "text-slate-400")} />
          <span>Tabla General</span>
        </button>
        <button
          onClick={() => setActiveTab("scorers")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none",
            activeTab === "scorers"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
          )}
        >
          <Target size={14} className={clsx(activeTab === "scorers" ? "text-rose-500" : "text-slate-400")} />
          <span>Goleadores</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none",
            activeTab === "history"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
          )}
        >
          <BarChart3 size={14} className={clsx(activeTab === "history" ? "text-emerald-500" : "text-slate-400")} />
          <span>Comparación Histórica</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="p-4 bg-slate-50/[0.15] dark:bg-slate-800/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "standings" && renderStandingsTab()}
            {activeTab === "scorers" && renderScorersTab()}
            {activeTab === "history" && renderHistoryTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

