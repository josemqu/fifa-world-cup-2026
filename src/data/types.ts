export type Team = {
  id: string;
  name: string;
  code?: string; // ISO code or similar if available, for flags
  group: string;
  isPlaceholder?: boolean;
  ranking?: number; // FIFA Ranking
  fifaPoints?: number; // FIFA Ranking Points (Total Points)
  // Stats for group stage
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
};

export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: string;
  time?: string;
  location?: string; // Stadium - City
  finished: boolean;
};

export type Group = {
  name: string; // "A", "B", ...
  teams: Team[];
  matches: Match[];
};

export type GroupStageData = {
  [key: string]: Group;
};

// Knockout Types
export type KnockoutStage = "R32" | "R16" | "QF" | "SF" | "Final" | "3rdPlace";

export type KnockoutMatch = {
  id: string;
  stage: KnockoutStage;
  homeTeam: Team | null | { placeholder: string }; // Team or placeholder like "1A", "2B"
  awayTeam: Team | null | { placeholder: string };
  homeScore?: number | null;
  awayScore?: number | null;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  winner?: Team | null;
  nextMatchId?: string; // Where the winner goes
  probabilisticData?: {
    homeTeamProb: number; // 0-1
    awayTeamProb: number; // 0-1
    matchupProb: number; // 0-1
    projectedHomeTeam?: Team;
    projectedAwayTeam?: Team;
    homeCandidates?: { team: Team; probability: number }[];
    awayCandidates?: { team: Team; probability: number }[];
  };
};
