import { Group, Team } from "@/data/types";
import {
  THIRD_PLACE_MATRIX,
  R32_MATCHES,
  ThirdPlaceCombination,
} from "@/data/knockoutData";

export function getGroupStandings(groups: Group[]) {
  const qualified: {
    [key: string]: { first: Team; second: Team; third: Team };
  } = {};
  const thirdPlaceTeams: Team[] = [];

  groups.forEach((group) => {
    const sorted = [...group.teams].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
      return b.gf - a.gf;
    });

    qualified[group.name] = {
      first: sorted[0],
      second: sorted[1],
      third: sorted[2],
    };

    thirdPlaceTeams.push(sorted[2]);
  });

  return { qualified, thirdPlaceTeams };
}

export function getSortedThirdPlaceTeams(thirdPlaceTeams: Team[]) {
  return [...thirdPlaceTeams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.won - a.won;
  });
}

export function getBestThirdPlaceTeams(thirdPlaceTeams: Team[]): Team[] {
  // Sort all 3rd place teams
  return getSortedThirdPlaceTeams(thirdPlaceTeams).slice(0, 8); // Take top 8
}

export function getKnockoutPairings(groups: Group[]) {
  const { qualified, thirdPlaceTeams } = getGroupStandings(groups);
  const bestThirds = getBestThirdPlaceTeams(thirdPlaceTeams);

  // Get the group names of the best 8 thirds
  const qualifiedGroups = bestThirds.map((t) => t.group).sort();

  // Find matching combination
  const combination = THIRD_PLACE_MATRIX.find((c) => {
    const cGroups = [...c.groups].sort();
    if (cGroups.length !== qualifiedGroups.length) return false;
    return cGroups.every((val, index) => val === qualifiedGroups[index]);
  });

  return {
    qualified,
    bestThirds,
    combination,
  };
}

export function generateR32Matches(groups: Group[]) {
  const { qualified, combination, bestThirds } = getKnockoutPairings(groups);

  // Fallback assignment logic if combination is missing but we have 8 thirds
  let fallbackAssignments: { [key: string]: Team } = {};
  if (!combination && bestThirds.length === 8) {
    // We need to assign bestThirds to the variable matches.
    // Variable matches home teams groups:
    const variableHomeGroups = R32_MATCHES.filter(
      (m) => m.type === "variable"
    ).map((m) => m.home.charAt(1));

    // Simple greedy assignment:
    // Try to assign each home group a third place team from a different group
    const availableThirds = [...bestThirds];
    const assignments: { [key: string]: Team } = {};

    // Sort home groups to prioritize hard-to-match ones? Not strictly necessary for fallback.
    for (const homeGroup of variableHomeGroups) {
      const candidateIndex = availableThirds.findIndex(
        (t) => t.group !== homeGroup
      );
      if (candidateIndex !== -1) {
        assignments[homeGroup] = availableThirds[candidateIndex];
        availableThirds.splice(candidateIndex, 1);
      }
    }
    fallbackAssignments = assignments;
  }

  return R32_MATCHES.map((match) => {
    let homeTeam: Team | { placeholder: string } = { placeholder: match.home };
    let awayTeam: Team | { placeholder: string } = { placeholder: match.away };

    // Resolve Home Team
    if (match.type === "fixed") {
      // e.g. "2A"
      const rank = match.home.charAt(0); // "2"
      const groupName = match.home.charAt(1); // "A"
      if (rank === "1") homeTeam = qualified[groupName].first;
      else if (rank === "2") homeTeam = qualified[groupName].second;
    } else if (match.type === "variable") {
      // e.g. "1E"
      const rank = match.home.charAt(0);
      const groupName = match.home.charAt(1);
      if (rank === "1") homeTeam = qualified[groupName].first;
    }

    // Resolve Away Team
    if (match.type === "fixed") {
      const rank = match.away.charAt(0);
      const groupName = match.away.charAt(1);
      if (rank === "1") awayTeam = qualified[groupName].first;
      else if (rank === "2") awayTeam = qualified[groupName].second;
    } else if (match.type === "variable") {
      // match.away is "3?"
      // We need the combination logic
      if (combination) {
        const homeGroup = match.home.charAt(1); // e.g. "E" from "1E"
        const opponentGroup = combination.matchups[homeGroup]; // e.g. "L"
        if (opponentGroup) {
          awayTeam = qualified[opponentGroup].third;
        } else {
          // @ts-ignore
          if (match.possibilities) {
            // @ts-ignore
            awayTeam = { placeholder: `3° (${match.possibilities.join("/")})` };
          } else {
            awayTeam = { placeholder: `3° ?` };
          }
        }
      } else {
        // Fallback: Check if we have a calculated assignment
        const homeGroup = match.home.charAt(1);
        if (fallbackAssignments[homeGroup]) {
          awayTeam = fallbackAssignments[homeGroup];
        } else {
          // Fallback if no combination matches yet (e.g. not enough games played)
          // @ts-ignore
          if (match.possibilities) {
            // @ts-ignore
            awayTeam = { placeholder: `3° (${match.possibilities.join("/")})` };
          } else {
            awayTeam = { placeholder: match.away };
          }
        }
      }
    }

    return {
      ...match,
      homeTeam,
      awayTeam,
    };
  });
}
