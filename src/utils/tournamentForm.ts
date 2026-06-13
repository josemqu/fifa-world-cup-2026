import { Group } from "@/data/types";

/**
 * Tournament Form Factor
 *
 * Computes per-team offensive and defensive form based on actual results
 * (finished matches only) from the current tournament. This allows the
 * prediction engine to adjust lambdas so that teams on a hot streak
 * get a boost and teams conceding many goals get penalised.
 *
 * The form is expressed as a ratio vs the tournament-wide average:
 *   formOfensiva  = (team GF / played) / tournamentAvgGoalsPerTeamPerMatch
 *   formDefensiva = (team GA / played) / tournamentAvgGoalsPerTeamPerMatch
 *
 * A value > 1 means the team scores (or concedes) MORE than average.
 * A value of exactly 1 means no adjustment (neutral).
 *
 * When a team has no played matches yet, both values default to 1.0.
 */

export type TeamForm = {
  formOfensiva: number; // > 1 = scores more than average
  formDefensiva: number; // > 1 = concedes more than average
};

export type TournamentFormMap = Map<string, TeamForm>;

/** Clamp a value to [lo, hi]. */
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** Default average goals per team per match in a World Cup (~1.3). */
const FALLBACK_AVG = 1.3;

/** Safety clamp range for form factors. */
const FORM_MIN = 0.5;
const FORM_MAX = 2.0;

/**
 * Compute tournament form for every team across all groups.
 *
 * Only matches that have actual scores (homeScore != null && awayScore != null)
 * are considered. Simulated / future matches are ignored.
 *
 * @param groups The current group-stage data (with live/finished scores merged).
 * @returns A Map from teamId to { formOfensiva, formDefensiva }.
 */
export function computeTournamentForm(groups: Group[]): TournamentFormMap {
  const formMap: TournamentFormMap = new Map();

  // --- 1. Accumulate raw stats from played matches ---
  // Per-team accumulators
  const teamStats = new Map<
    string,
    { gf: number; ga: number; played: number }
  >();

  // Initialise every team with zeros
  for (const group of groups) {
    for (const team of group.teams) {
      teamStats.set(team.id, { gf: 0, ga: 0, played: 0 });
    }
  }

  // Walk through every match that has an actual score
  for (const group of groups) {
    for (const match of group.matches) {
      const hasScore =
        match.homeScore != null && match.awayScore != null;
      if (!hasScore) continue;

      const homeScore = match.homeScore as number;
      const awayScore = match.awayScore as number;

      const home = teamStats.get(match.homeTeamId);
      const away = teamStats.get(match.awayTeamId);

      if (home) {
        home.gf += homeScore;
        home.ga += awayScore;
        home.played += 1;
      }
      if (away) {
        away.gf += awayScore;
        away.ga += homeScore;
        away.played += 1;
      }
    }
  }

  // --- 2. Compute tournament-wide average ---
  let totalGoals = 0;
  let totalAppearances = 0; // each team-match is one "appearance"

  teamStats.forEach(({ gf, played }) => {
    totalGoals += gf;
    totalAppearances += played;
  });

  // Average goals scored per team per match across the whole tournament.
  // Falls back to a sensible default if no matches have been played yet.
  const tournamentAvg =
    totalAppearances > 0 ? totalGoals / totalAppearances : FALLBACK_AVG;

  // --- 3. Compute per-team form factors ---
  teamStats.forEach(({ gf, ga, played }, teamId) => {
    if (played === 0) {
      // No data → neutral form
      formMap.set(teamId, { formOfensiva: 1.0, formDefensiva: 1.0 });
      return;
    }

    const avgGF = gf / played;
    const avgGA = ga / played;

    const rawOffensive = avgGF / tournamentAvg;
    const rawDefensive = avgGA / tournamentAvg;

    formMap.set(teamId, {
      formOfensiva: clamp(rawOffensive, FORM_MIN, FORM_MAX),
      formDefensiva: clamp(rawDefensive, FORM_MIN, FORM_MAX),
    });
  });

  return formMap;
}
