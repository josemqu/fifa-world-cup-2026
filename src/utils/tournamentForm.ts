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
 * Dampening factor based on matches played:
 * - 1 match: 40% of the deviation from 1.0 (neutral) is applied.
 * - 2 matches: 70% of the deviation from 1.0 (neutral) is applied.
 * - 3+ matches: 100% of the deviation is applied.
 */
const getFormDampeningFactor = (played: number): number => {
  if (played <= 0) return 0;
  if (played === 1) return 0.4;
  if (played === 2) return 0.7;
  return 1.0;
};

/**
 * Compute tournament form for every team across all groups.
 *
 * Only matches that have actual scores (homeScore != null && awayScore != null)
 * are considered. Simulated / future matches are ignored.
 *
 * GF (goals scored) and GA (goals conceded) are weighted based on the relative
 * strength (FIFA Points) of the opponent compared to the tournament average:
 * - Scoring against a strong team is worth more (up to 2.0x weight).
 * - Conceding against a strong team is penalized less (down to 0.2x weight).
 * - Conversely, scoring against a weak team is worth less, and conceding is penalized more.
 *
 * @param groups The current group-stage data (with live/finished scores merged).
 * @returns A Map from teamId to { formOfensiva, formDefensiva }.
 */
export function computeTournamentForm(groups: Group[]): TournamentFormMap {
  const formMap: TournamentFormMap = new Map();

  // --- 1. Compute average FIFA points of teams in the tournament ---
  let totalFifaPoints = 0;
  let totalTeams = 0;
  const teamPointsMap = new Map<string, number>();

  for (const group of groups) {
    for (const team of group.teams) {
      const pointsRaw = team.fifaPoints ?? (2000 - (team.ranking ?? 50) * 10);
      const points = Math.max(1000, Math.min(2000, pointsRaw));
      teamPointsMap.set(team.id, points);
      totalFifaPoints += points;
      totalTeams += 1;
    }
  }

  const averageFifaPoints = totalTeams > 0 ? totalFifaPoints / totalTeams : 1500;

  // --- 2. Accumulate weighted stats from played matches ---
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

      if (home && away) {
        const pointsHome = teamPointsMap.get(match.homeTeamId) ?? 1500;
        const pointsAway = teamPointsMap.get(match.awayTeamId) ?? 1500;

        // Home team: opponent is Away.
        // If Away points > average, diff is positive (Away is strong).
        const diffHome = (pointsAway - averageFifaPoints) / 500;
        const gfWeightHome = clamp(1.0 + diffHome, 0.2, 2.0);
        const gaWeightHome = clamp(1.0 - diffHome, 0.2, 2.0);

        home.gf += homeScore * gfWeightHome;
        home.ga += awayScore * gaWeightHome;
        home.played += 1;

        // Away team: opponent is Home.
        // If Home points > average, diff is positive (Home is strong).
        const diffAway = (pointsHome - averageFifaPoints) / 500;
        const gfWeightAway = clamp(1.0 + diffAway, 0.2, 2.0);
        const gaWeightAway = clamp(1.0 - diffAway, 0.2, 2.0);

        away.gf += awayScore * gfWeightAway;
        away.ga += homeScore * gaWeightAway;
        away.played += 1;
      }
    }
  }

  // --- 3. Compute tournament-wide average of weighted goals ---
  let totalGoals = 0;
  let totalAppearances = 0; // each team-match is one "appearance"

  teamStats.forEach(({ gf, played }) => {
    totalGoals += gf;
    totalAppearances += played;
  });

  // Average weighted goals scored per team per match across the whole tournament.
  // Falls back to a sensible default if no matches have been played yet.
  const tournamentAvg =
    totalAppearances > 0 ? totalGoals / totalAppearances : FALLBACK_AVG;

  // --- 4. Compute per-team form factors ---
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

    const dampening = getFormDampeningFactor(played);
    const offensiveForm = 1.0 + (rawOffensive - 1.0) * dampening;
    const defensiveForm = 1.0 + (rawDefensive - 1.0) * dampening;

    formMap.set(teamId, {
      formOfensiva: clamp(offensiveForm, FORM_MIN, FORM_MAX),
      formDefensiva: clamp(defensiveForm, FORM_MIN, FORM_MAX),
    });
  });

  return formMap;
}
