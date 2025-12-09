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
  home: { ranking?: number; fifaPoints?: number } = {},
  away: { ranking?: number; fifaPoints?: number } = {}
): { home: number; away: number } => {
  let diff = 0;
  let factor = 0.02;

  if (home.fifaPoints && away.fifaPoints) {
    diff = home.fifaPoints - away.fifaPoints; // Positive if home is better (higher points)
    factor = 0.003; // Approx 0.003 for points (e.g. 100 diff -> 0.3 goals)
  } else {
    const homeRank = home.ranking || 50;
    const awayRank = away.ranking || 50;
    diff = awayRank - homeRank; // Positive if home is better (lower rank)
    factor = 0.02; // Approx 0.02 for rank (e.g. 15 diff -> 0.3 goals)
  }

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
      // @ts-ignore
      date: m.date,
      // @ts-ignore
      time: m.time,
      // @ts-ignore
      location: m.location,
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
      // @ts-ignore
      date: m.date,
      // @ts-ignore
      time: m.time,
      // @ts-ignore
      location: m.location,
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
      // @ts-ignore
      date: m.date,
      // @ts-ignore
      time: m.time,
      // @ts-ignore
      location: m.location,
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
      // @ts-ignore
      date: m.date,
      // @ts-ignore
      time: m.time,
      // @ts-ignore
      location: m.location,
    });
  });

  return matches;
};

export const runKnockoutSimulation = (
  matches: KnockoutMatch[]
): KnockoutMatch[] => {
  const allStaticMatches = [
    ...R16_MATCHES,
    ...QF_MATCHES,
    ...SF_MATCHES,
    ...FINAL_MATCHES,
  ];

  let newMatches = matches.map((m) => {
    // Update metadata for non-R32 matches (or all, but R32 is usually from generator)
    // We check if it exists in static definitions
    const def = allStaticMatches.find((d) => d.id === m.id);
    if (def) {
      return {
        ...m,
        // @ts-ignore
        date: def.date,
        // @ts-ignore
        time: def.time,
        // @ts-ignore
        location: def.location,
      };
    }
    return m;
  });

  // Sort by ID to ensure we process stages in order (R32 -> R16 -> ... -> Final)
  newMatches.sort((a, b) => Number(a.id) - Number(b.id));

  for (let i = 0; i < newMatches.length; i++) {
    const match = newMatches[i];

    // Only simulate if teams are present
    if (
      match.homeTeam &&
      !("placeholder" in match.homeTeam) &&
      match.awayTeam &&
      !("placeholder" in match.awayTeam)
    ) {
      let winner: Team | null = match.winner || null;

      // Check if match is already played/simulated (has scores)
      const isPlayed = match.homeScore != null && match.awayScore != null;

      if (!isPlayed) {
        // Generate realistic scores based on ranking
        const hTeam = match.homeTeam as Team;
        const aTeam = match.awayTeam as Team;

        const { home, away } = predictMatchScore(hTeam, aTeam);

        match.homeScore = home;
        match.awayScore = away;

        // Determine winner
        if (home > away) {
          winner = match.homeTeam as Team;
        } else if (away > home) {
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
      } else {
        // If played but winner not set (shouldn't happen if merged correctly, but safety check)
        if (!winner) {
          if ((match.homeScore as number) > (match.awayScore as number)) {
            winner = match.homeTeam as Team;
          } else if (
            (match.awayScore as number) > (match.homeScore as number)
          ) {
            winner = match.awayTeam as Team;
          } else if (
            match.homePenalties != null &&
            match.awayPenalties != null
          ) {
            if (match.homePenalties > match.awayPenalties) {
              winner = match.homeTeam as Team;
            } else {
              winner = match.awayTeam as Team;
            }
          } else {
            // Tied but no penalties entered yet. Simulate them to determine a winner for progression.
            let homePens = 0;
            let awayPens = 0;
            do {
              homePens = Math.floor(Math.random() * 5) + 3;
              awayPens = Math.floor(Math.random() * 5) + 3;
            } while (homePens === awayPens);

            // We only set these for the simulation instance
            // If this is the "Simulate" button, these values will be saved.
            // If this is probability calc, they are transient.
            match.homePenalties = homePens;
            match.awayPenalties = awayPens;

            if (homePens > awayPens) winner = match.homeTeam as Team;
            else winner = match.awayTeam as Team;
          }
          match.winner = winner;
        }
      }

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
  initialGroups: Group[],
  currentKnockoutMatches: KnockoutMatch[] = []
): { groups: Group[]; knockoutMatches: KnockoutMatch[] } => {
  // 1. Simulate Groups locally (respecting existing results)
  // Deep clone to avoid mutating input
  const simulatedGroups = initialGroups.map((group) => {
    const updatedMatches = group.matches.map((match) => {
      if (match.finished) return match; // Keep existing results

      const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
      const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);

      const { home, away } = predictMatchScore(homeTeam, awayTeam);

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

  // 4. Merge with current knockout state (overlay user results)
  const mergedMatches = allMatches.map((generatedMatch) => {
    const existingMatch = currentKnockoutMatches.find(
      (m) => m.id === generatedMatch.id
    );

    if (
      existingMatch &&
      existingMatch.homeScore != null &&
      existingMatch.awayScore != null
    ) {
      // Check if teams match
      const hTeamGen = generatedMatch.homeTeam as Team;
      const aTeamGen = generatedMatch.awayTeam as Team;
      const hTeamEx = existingMatch.homeTeam as Team;
      const aTeamEx = existingMatch.awayTeam as Team;

      // Ensure teams are defined and IDs match
      const homeMatches = hTeamGen && hTeamEx && hTeamGen.id === hTeamEx.id;
      const awayMatches = aTeamGen && aTeamEx && aTeamGen.id === aTeamEx.id;

      if (homeMatches && awayMatches) {
        return {
          ...generatedMatch,
          homeScore: existingMatch.homeScore,
          awayScore: existingMatch.awayScore,
          homePenalties: existingMatch.homePenalties,
          awayPenalties: existingMatch.awayPenalties,
          winner: existingMatch.winner,
        };
      }
    }
    return generatedMatch;
  });

  // 5. Run Knockout Simulation
  const simulatedKnockoutMatches = runKnockoutSimulation(mergedMatches);

  return {
    groups: simulatedGroups,
    knockoutMatches: simulatedKnockoutMatches,
  };
};
