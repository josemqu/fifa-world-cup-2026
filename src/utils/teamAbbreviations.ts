import { COUNTRIES, getCountryFifaCode } from "./countries";

// Deprecated: Use COUNTRIES from ./countries.ts directly if possible
export const TEAM_ABBREVIATIONS: Record<string, string> = COUNTRIES.reduce(
  (acc, country) => {
    acc[country.name] = country.fifaCode;
    return acc;
  },
  {} as Record<string, string>
);

export const getTeamAbbreviation = (name: string): string => {
  return getCountryFifaCode(name);
};
