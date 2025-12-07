import { Group, Team, KnockoutMatch } from "@/data/types";
import { generateR32Matches } from "@/utils/knockoutUtils";
import {
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";

// Helper functions for simulation
export const poisson = (lambda: number): number => {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
};

export const predictMatchScore = (
  homeRank: number = 50,
  awayRank: number = 50
): { home: number; away: number } => {
  const diff = awayRank - homeRank; // Positive if home is better (lower rank)
  const factor = 0.02; // Tuning factor for strength difference

  // Base expected goals ~1.4 per team
  let homeLambda = 1.4 + diff * factor;
  let awayLambda = 1.4 - diff * factor;

  // Clamp values to be realistic
  homeLambda = Math.max(0.2, Math.min(5.0, homeLambda));
  awayLambda = Math.max(0.2, Math.min(5.0, awayLambda));

  return {
    home: poisson(homeLambda),
    away: poisson(awayLambda),
  };
};

export const recalculateGroupStats = (group: Group): Group => {
  // Reset stats for all teams
  const newTeams = group.teams.map((team) => ({
    ...team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    pts: 0,
  }));

  // Map for easy access
  const teamMap = new Map<string, Team>();
  newTeams.forEach((t) => teamMap.set(t.id, t));

  // Process matches
  group.matches.forEach((match) => {
    if (
      match.homeScore !== undefined &&
      match.homeScore !== null &&
      match.awayScore !== undefined &&
      match.awayScore !== null
    ) {
      const homeTeam = teamMap.get(match.homeTeamId);
      const awayTeam = teamMap.get(match.awayTeamId);

      if (homeTeam && awayTeam) {
        // Update Played
        homeTeam.played += 1;
        awayTeam.played += 1;

        // Update Goals
        homeTeam.gf += match.homeScore;
        homeTeam.ga += match.awayScore;
        awayTeam.gf += match.awayScore;
        awayTeam.ga += match.homeScore;

        // Update W/D/L and Points
        if (match.homeScore > match.awayScore) {
          homeTeam.won += 1;
          homeTeam.pts += 3;
          awayTeam.lost += 1;
        } else if (match.homeScore < match.awayScore) {
          awayTeam.won += 1;
          awayTeam.pts += 3;
          homeTeam.lost += 1;
        } else {
          homeTeam.drawn += 1;
          homeTeam.pts += 1;
          awayTeam.drawn += 1;
          awayTeam.pts += 1;
        }
      }
    }
  });

  return {
    ...group,
    teams: newTeams,
  };
};

export const getInitialKnockoutMatches = (): KnockoutMatch[] => {
  const matches: KnockoutMatch[] = [];

  // R16 (89-96)
  R16_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: "R16",
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
      nextMatchId: m.next,
    });
  });

  // QF (97-100)
  QF_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: "QF",
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
      nextMatchId: m.next,
    });
  });

  // SF (101-102)
  SF_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: "SF",
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
      nextMatchId: m.next,
    });
  });

  // Final & 3rd Place (103-104)
  FINAL_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: m.id === "103" ? "3rdPlace" : "Final",
      homeTeam: {
        placeholder: m.home.startsWith("W")
          ? `W${m.home.replace("W", "")}`
          : `L${m.home.replace("L", "")}`,
      },
      awayTeam: {
        placeholder: m.away.startsWith("W")
          ? `W${m.away.replace("W", "")}`
          : `L${m.away.replace("L", "")}`,
      },
      nextMatchId: m.next || undefined,
    });
  });

  return matches;
};

export const runKnockoutSimulation = (
  matches: KnockoutMatch[]
): KnockoutMatch[] => {
  const newMatches = [...matches];
  // Sort by ID to ensure we process stages in order (R32 -> R16 -> ... -> Final)
  newMatches.sort((a, b) => Number(a.id) - Number(b.id));

  const allStaticMatches = [
    ...R16_MATCHES,
    ...QF_MATCHES,
    ...SF_MATCHES,
    ...FINAL_MATCHES,
  ];

  for (let i = 0; i < newMatches.length; i++) {
    const match = newMatches[i];

    // Only simulate if teams are present
    if (
      match.homeTeam &&
      !("placeholder" in match.homeTeam) &&
      match.awayTeam &&
      !("placeholder" in match.awayTeam)
    ) {
      // Generate realistic scores based on ranking
      const hTeam = match.homeTeam as Team;
      const aTeam = match.awayTeam as Team;

      const { home, away } = predictMatchScore(hTeam.ranking, aTeam.ranking);

      const homeScore = home;
      const awayScore = away;
      match.homeScore = homeScore;
      match.awayScore = awayScore;

      let winner: Team | null = null;
      match.homePenalties = null;
      match.awayPenalties = null;

      if (homeScore > awayScore) {
        winner = match.homeTeam as Team;
      } else if (awayScore > homeScore) {
        winner = match.awayTeam as Team;
      } else {
        // Penalties
        let homePens = 0;
        let awayPens = 0;
        do {
          homePens = Math.floor(Math.random() * 5) + 3;
          awayPens = Math.floor(Math.random() * 5) + 3;
        } while (homePens === awayPens);

        match.homePenalties = homePens;
        match.awayPenalties = awayPens;

        if (homePens > awayPens) winner = match.homeTeam as Team;
        else winner = match.awayTeam as Team;
      }
      match.winner = winner;

      // Propagate to next match
      if (match.nextMatchId) {
        const nextMatchIndex = newMatches.findIndex(
          (m) => m.id === match.nextMatchId
        );
        if (nextMatchIndex !== -1) {
          const nextMatch = newMatches[nextMatchIndex];
          const staticNextMatch = allStaticMatches.find(
            (m) => m.id === match.nextMatchId
          );

          if (staticNextMatch) {
            const isHomeSource =
              staticNextMatch.home === `W${match.id}` ||
              staticNextMatch.home === `L${match.id}`;
            const isAwaySource =
              staticNextMatch.away === `W${match.id}` ||
              staticNextMatch.away === `L${match.id}`;

            if (winner) {
              if (isHomeSource) {
                if (staticNextMatch.home === `L${match.id}`) {
                  const loser =
                    winner.id === (match.homeTeam as Team).id
                      ? match.awayTeam
                      : match.homeTeam;
                  nextMatch.homeTeam = loser as Team;
                } else {
                  nextMatch.homeTeam = winner;
                }
              }
              if (isAwaySource) {
                if (staticNextMatch.away === `L${match.id}`) {
                  const loser =
                    winner.id === (match.homeTeam as Team).id
                      ? match.awayTeam
                      : match.homeTeam;
                  nextMatch.awayTeam = loser as Team;
                } else {
                  nextMatch.awayTeam = winner;
                }
              }
            }
          }
        }
      }

      // Special handling for SF matches propagating to 3rd Place match (103)
      if (match.id === "101" || match.id === "102") {
        const thirdPlaceMatchId = "103";
        const thirdPlaceIndex = newMatches.findIndex(
          (m) => m.id === thirdPlaceMatchId
        );
        if (thirdPlaceIndex !== -1) {
          const thirdPlaceMatch = newMatches[thirdPlaceIndex];
          const staticThirdPlace = FINAL_MATCHES.find(
            (m) => m.id === thirdPlaceMatchId
          );

          if (staticThirdPlace) {
            const isHomeSource = staticThirdPlace.home === `L${match.id}`;
            const isAwaySource = staticThirdPlace.away === `L${match.id}`;

            if (winner) {
              const loser =
                winner.id === (match.homeTeam as Team).id
                  ? match.awayTeam
                  : match.homeTeam;

              if (isHomeSource) {
                thirdPlaceMatch.homeTeam = loser as Team;
              }
              if (isAwaySource) {
                thirdPlaceMatch.awayTeam = loser as Team;
              }
            }
          }
        }
      }
    }
  }

  return newMatches;
};

export const simulateTournament = (
  initialGroups: Group[]
): { groups: Group[]; knockoutMatches: KnockoutMatch[] } => {
  // 1. Simulate Groups locally (respecting existing results)
  // Deep clone to avoid mutating input
  const simulatedGroups = initialGroups.map((group) => {
    const updatedMatches = group.matches.map((match) => {
      if (match.finished) return match; // Keep existing results

      const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
      const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);

      const { home, away } = predictMatchScore(
        homeTeam?.ranking,
        awayTeam?.ranking
      );

      return {
        ...match,
        homeScore: home,
        awayScore: away,
        finished: true,
      };
    });

    return recalculateGroupStats({ ...group, matches: updatedMatches });
  });

  // 2. Generate R32 Matches
  const r32 = generateR32Matches(simulatedGroups).map((m) => ({
    ...m,
    stage: "R32" as const,
  }));

  // 3. Create Full Knockout Structure (R32 + initial empty R16-Final)
  const initialKnockout = getInitialKnockoutMatches();
  // Merge: R32 from generator + initial empty stages
  const allMatches = [...r32, ...initialKnockout].sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  // 4. Run Knockout Simulation
  const simulatedKnockoutMatches = runKnockoutSimulation(allMatches);

  return {
    groups: simulatedGroups,
    knockoutMatches: simulatedKnockoutMatches,
  };
};
