export type Team = {
  id: string;
  name: string;
  code?: string; // ISO code or similar if available, for flags
  group: string;
  isPlaceholder?: boolean;
  // Stats for group stage
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
};

export type Group = {
  name: string; // "A", "B", ...
  teams: Team[];
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
  winner?: Team | null;
  nextMatchId?: string; // Where the winner goes
};
