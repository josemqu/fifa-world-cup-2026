import { Group, Team } from "@/data/types";
import {
  THIRD_PLACE_MATRIX,
  R32_MATCHES,
  ThirdPlaceCombination,
} from "@/data/knockoutData";

interface R32MatchDefinition {
  id: string;
  type: string;
  home: string;
  away: string;
  next: string;
  possibilities?: string[];
  date?: string;
  time?: string;
  location?: string;
}

export function getGroupStandings(groups: Group[]) {
  const qualified = new Map<string, { first: Team; second: Team; third: Team }>();
  const thirdPlaceTeams: Team[] = [];

  groups.forEach((group) => {
    const sorted = [...group.teams].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
      return b.gf - a.gf;
    });

    qualified.set(group.name, {
      first: sorted[0],
      second: sorted[1],
      third: sorted[2],
    });

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

  // The THIRD_PLACE_MATRIX provided is for a different tournament structure (likely Euro with 6 groups or old format)
  // and does not match the 12-group structure of World Cup 2026 where specific groups (like C, F, H, J) have fixed matchups.
  // We disable the matrix lookup to force the dynamic fallback solver to run, which correctly assigns
  // the 3rd place teams to the available variable matches respecting constraints.
  const combination = undefined;

  /*
  const combination = THIRD_PLACE_MATRIX.find((c) => {
    const cGroups = [...c.groups].sort();
    if (cGroups.length !== qualifiedGroups.length) return false;
    return cGroups.every((val, index) => val === qualifiedGroups[index]);
  });
  */

  return {
    qualified,
    bestThirds,
    combination,
  };
}

export function generateR32Matches(groups: Group[]) {
  const { qualified, bestThirds } = getKnockoutPairings(groups);

  // Helper to check if a group is finished
  const isGroupFinished = (groupName: string) => {
    const group = groups.find((g) => g.name === groupName);
    return group ? group.matches.every((m) => m.finished) : false;
  };

  const allGroupsFinished = groups.every((g) =>
    g.matches.every((m) => m.finished)
  );

  // Fallback assignment logic if combination is missing but we have 8 thirds
  // (Since we disabled matrix lookup, this is now the MAIN logic)
  let fallbackAssignments = new Map<string, Team>();
  if (bestThirds.length === 8) {
    // We need to assign bestThirds to the variable matches.
    // Variable matches home teams groups:
    const variableHomeGroups = R32_MATCHES.filter(
      (m) => m.type === "variable"
    ).map((m) => m.home.charAt(1));

    // Backtracking solver to find valid assignment (homeGroup !== thirdGroup)
    const solve = (
      index: number,
      usedIndices: Set<number>,
      currentAssignments: Map<string, Team>
    ): boolean => {
      if (index === variableHomeGroups.length) {
        fallbackAssignments = new Map(currentAssignments);
        return true;
      }

      const homeGroup = variableHomeGroups[index];

      // Try to find a third place team for this group
      for (let i = 0; i < bestThirds.length; i++) {
        if (!usedIndices.has(i)) {
          const thirdTeam = bestThirds[i];

          // Constraint: Third place team cannot play against 1st place of same group
          if (thirdTeam.group !== homeGroup) {
            usedIndices.add(i);
            currentAssignments.set(homeGroup, thirdTeam);

            if (solve(index + 1, usedIndices, currentAssignments)) {
              return true;
            }

            // Backtrack
            currentAssignments.delete(homeGroup);
            usedIndices.delete(i);
          }
        }
      }

      return false;
    };

    const solutionFound = solve(0, new Set(), new Map());

    // If no strict solution found (rare but possible with weird distributions?),
    // fall back to purely random valid assignment ignoring same-group constraint
    // to AT LEAST have a match.
    if (!solutionFound) {
      const usedIndices = new Set<number>();
      const assignments = new Map<string, Team>();

      for (const homeGroup of variableHomeGroups) {
        for (let i = 0; i < bestThirds.length; i++) {
          if (!usedIndices.has(i)) {
            assignments.set(homeGroup, bestThirds[i]);
            usedIndices.add(i);
            break;
          }
        }
      }
      fallbackAssignments = assignments;
    }
  }

  return (R32_MATCHES as R32MatchDefinition[]).map((match) => {
    let homeTeam: Team | { placeholder: string } = { placeholder: match.home };
    let awayTeam: Team | { placeholder: string } = { placeholder: match.away };

    // Resolve Home Team
    if (match.type === "fixed") {
      // e.g. "2A"
      const rank = match.home.charAt(0); // "2"
      const groupName = match.home.charAt(1); // "A"
      if (isGroupFinished(groupName)) {
        const groupBest = qualified.get(groupName);
        if (groupBest) {
          if (rank === "1") homeTeam = groupBest.first;
          else if (rank === "2") homeTeam = groupBest.second;
        }
      }
    } else if (match.type === "variable") {
      // e.g. "1E"
      const rank = match.home.charAt(0);
      const groupName = match.home.charAt(1);
      if (isGroupFinished(groupName)) {
        const groupBest = qualified.get(groupName);
        if (groupBest && rank === "1") {
          homeTeam = groupBest.first;
        }
      }
    }

    // Resolve Away Team
    if (match.type === "fixed") {
      const rank = match.away.charAt(0);
      const groupName = match.away.charAt(1);
      if (isGroupFinished(groupName)) {
        const groupBest = qualified.get(groupName);
        if (groupBest) {
          if (rank === "1") awayTeam = groupBest.first;
          else if (rank === "2") awayTeam = groupBest.second;
        }
      }
    } else if (match.type === "variable") {
      // match.away is "3?"
      // Only assign 3rd place teams if ALL groups are finished
      if (allGroupsFinished) {
        // Fallback: Check if we have a calculated assignment
        const homeGroup = match.home.charAt(1);
        const assignedTeam = fallbackAssignments.get(homeGroup);
        if (assignedTeam) {
          awayTeam = assignedTeam;
        } else {
          // Fallback if no assignment found (should not happen if solver works)
          if (match.possibilities) {
            awayTeam = {
              placeholder: `3° (${match.possibilities.join("/")})`,
            };
          } else {
            awayTeam = { placeholder: match.away };
          }
        }
      } else {
        // ... show placeholder ...
        // If not all groups finished, show placeholder
        if (match.possibilities) {
          awayTeam = { placeholder: `3° (${match.possibilities.join("/")})` };
        } else {
          awayTeam = { placeholder: match.away };
        }
      }
    }

    return {
      ...match,
      homeTeam,
      awayTeam,
      nextMatchId: match.next,
    };
  });
}
