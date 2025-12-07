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

export function getBestThirdPlaceTeams(thirdPlaceTeams: Team[]): Team[] {
  // Sort all 3rd place teams
  return [...thirdPlaceTeams]
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
      return b.gf - a.gf;
    })
    .slice(0, 8); // Take top 8
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
  const { qualified, combination } = getKnockoutPairings(groups);

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
          awayTeam = { placeholder: `3° (${match.away.replace("3", "")})` };
        }
      } else {
        // Fallback if no combination matches yet (e.g. not enough games played)
        awayTeam = { placeholder: match.away };
      }
    }

    return {
      ...match,
      homeTeam,
      awayTeam,
    };
  });
}
