/**
 * Team Name Mapping: API-Football → Internal Match IDs
 *
 * API-Football returns English team names. We need to map them
 * to the internal team IDs used in initialData.ts (A1, A2, B1, etc.)
 *
 * This mapping also handles the reverse: internal team names (Spanish)
 * to API-Football names (English).
 */

// API-Football English name → Internal team ID
export const API_TEAM_TO_ID: Record<string, string> = {
  // Group A
  Mexico: "A1",
  "South Korea": "A2",
  "South Africa": "A3",
  "Czech Republic": "A4",

  // Group B
  Canada: "B1",
  Switzerland: "B2",
  Qatar: "B3",
  "Bosnia and Herzegovina": "B4",
  "Bosnia \u0026 Herzegovina": "B4",

  // Group C
  Brazil: "C1",
  Morocco: "C2",
  Scotland: "C3",
  Haiti: "C4",

  // Group D
  USA: "D1",
  "United States": "D1",
  Australia: "D2",
  Paraguay: "D3",
  Turkey: "D4",
  Turkiye: "D4",
  Türkiye: "D4",

  // Group E
  Germany: "E1",
  Ecuador: "E2",
  "Ivory Coast": "E3",
  "Cote D'Ivoire": "E3",
  Curacao: "E4",
  Curaçao: "E4",

  // Group F
  Netherlands: "F1",
  Japan: "F2",
  Tunisia: "F3",
  Sweden: "F4",

  // Group G
  Belgium: "G1",
  Egypt: "G2",
  Iran: "G3",
  "New Zealand": "G4",

  // Group H
  Spain: "H1",
  Uruguay: "H2",
  "Saudi Arabia": "H3",
  "Cape Verde": "H4",
  "Cabo Verde": "H4",

  // Group I
  France: "I1",
  Senegal: "I2",
  Norway: "I3",
  Iraq: "I4",

  // Group J
  Argentina: "J1",
  Austria: "J2",
  Algeria: "J3",
  Jordan: "J4",

  // Group K
  Portugal: "K1",
  Colombia: "K2",
  Uzbekistan: "K3",
  "DR Congo": "K4",
  "Congo DR": "K4",
  "Democratic Republic of the Congo": "K4",

  // Group L
  England: "L1",
  Croatia: "L2",
  Ghana: "L3",
  Panama: "L4",
};

// Internal Spanish name → Team ID (for matching by local name)
export const LOCAL_TEAM_TO_ID: Record<string, string> = {
  México: "A1",
  "Corea del Sur": "A2",
  Sudáfrica: "A3",
  "República Checa": "A4",
  Canadá: "B1",
  Suiza: "B2",
  Catar: "B3",
  "Bosnia y Herzegovina": "B4",
  Brasil: "C1",
  Marruecos: "C2",
  Escocia: "C3",
  Haití: "C4",
  "Estados Unidos": "D1",
  Australia: "D2",
  Paraguay: "D3",
  Turquía: "D4",
  Alemania: "E1",
  Ecuador: "E2",
  "Costa de Marfil": "E3",
  Curazao: "E4",
  "Países Bajos": "F1",
  Japón: "F2",
  Túnez: "F3",
  Suecia: "F4",
  Bélgica: "G1",
  Egipto: "G2",
  Irán: "G3",
  "Nueva Zelanda": "G4",
  España: "H1",
  Uruguay: "H2",
  "Arabia Saudita": "H3",
  "Cabo Verde": "H4",
  Francia: "I1",
  Senegal: "I2",
  Noruega: "I3",
  Iraq: "I4",
  Argentina: "J1",
  Austria: "J2",
  Argelia: "J3",
  Jordania: "J4",
  Portugal: "K1",
  Colombia: "K2",
  Uzbekistán: "K3",
  "RD Congo": "K4",
  Inglaterra: "L1",
  Croacia: "L2",
  Ghana: "L3",
  Panamá: "L4",
};

// Team ID → Group ID (extract letter from team ID)
export function getGroupFromTeamId(teamId: string): string {
  return teamId.charAt(0);
}

/**
 * Try to resolve a team name (from API-Football) to an internal team ID.
 * Uses case-insensitive matching with multiple fallbacks.
 */
export function resolveTeamId(apiTeamName: string): string | null {
  if (!apiTeamName) return null;

  // 1. Direct match
  if (API_TEAM_TO_ID[apiTeamName]) return API_TEAM_TO_ID[apiTeamName];

  // 2. Case-insensitive match
  const lower = apiTeamName.toLowerCase();
  for (const [key, value] of Object.entries(API_TEAM_TO_ID)) {
    if (key.toLowerCase() === lower) return value;
  }

  // 3. Partial match (contains)
  for (const [key, value] of Object.entries(API_TEAM_TO_ID)) {
    if (
      lower.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lower)
    ) {
      return value;
    }
  }

  console.warn(`[teamMapping] Could not resolve team: "${apiTeamName}"`);
  return null;
}

/**
 * Given two team IDs, find the matching group-stage match ID.
 * Match IDs follow the pattern: M{GroupLetter}{Number} (e.g. MA1, MB3)
 */
export function findGroupMatchId(
  homeTeamId: string,
  awayTeamId: string,
  groupMatches: Array<{ id: string; homeTeamId: string; awayTeamId: string }>
): string | null {
  const match = groupMatches.find(
    (m) => m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId
  );
  return match?.id || null;
}
