import { Group, Team, Match } from "./types";

const createTeam = (
  id: string,
  name: string,
  group: string,
  ranking: number,
  isPlaceholder = false
): Team => ({
  id,
  name,
  group,
  ranking,
  isPlaceholder,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  gf: 0,
  ga: 0,
  pts: 0,
});

const createGroupMatches = (groupName: string, teams: Team[]): Match[] => {
  // Standard scheduling: 1v2, 3v4, 1v3, 2v4, 4v1, 2v3
  // Indices: 0, 1, 2, 3
  const pairings = [
    { h: 0, a: 1, r: 1 },
    { h: 2, a: 3, r: 1 },
    { h: 0, a: 2, r: 2 },
    { h: 3, a: 1, r: 2 }, // 3 vs 1 often in round 2 or 1vs3
    { h: 3, a: 0, r: 3 }, // 4 vs 1
    { h: 1, a: 2, r: 3 }, // 2 vs 3
  ];

  return pairings.map((p, idx) => ({
    id: `M${groupName}${idx + 1}`,
    homeTeamId: teams[p.h].id,
    awayTeamId: teams[p.a].id,
    finished: false,
    date: `Jornada ${p.r}`,
    // random times/venues could be added here if needed, or left undefined
  }));
};

const RAW_GROUPS = [
  {
    name: "A",
    teams: [
      createTeam("A1", "México", "A", 15),
      createTeam("A2", "Corea del Sur", "A", 23),
      createTeam("A3", "Sudáfrica", "A", 60),
      createTeam("A4", "UEFA Playoff D", "A", 40, true),
    ],
  },
  {
    name: "B",
    teams: [
      createTeam("B1", "Canadá", "B", 35),
      createTeam("B2", "Suiza", "B", 19),
      createTeam("B3", "Catar", "B", 60),
      createTeam("B4", "UEFA Playoff A", "B", 40, true),
    ],
  },
  {
    name: "C",
    teams: [
      createTeam("C1", "Brasil", "C", 5),
      createTeam("C2", "Marruecos", "C", 13),
      createTeam("C3", "Escocia", "C", 45),
      createTeam("C4", "Haití", "C", 80),
    ],
  },
  {
    name: "D",
    teams: [
      createTeam("D1", "Estados Unidos", "D", 11),
      createTeam("D2", "Australia", "D", 24),
      createTeam("D3", "Paraguay", "D", 55),
      createTeam("D4", "UEFA Playoff C", "D", 40, true),
    ],
  },
  {
    name: "E",
    teams: [
      createTeam("E1", "Alemania", "E", 10),
      createTeam("E2", "Ecuador", "E", 30),
      createTeam("E3", "Costa de Marfil", "E", 45),
      createTeam("E4", "Curazao", "E", 90),
    ],
  },
  {
    name: "F",
    teams: [
      createTeam("F1", "Países Bajos", "F", 7),
      createTeam("F2", "Japón", "F", 16),
      createTeam("F3", "Túnez", "F", 35),
      createTeam("F4", "UEFA Playoff B", "F", 40, true),
    ],
  },
  {
    name: "G",
    teams: [
      createTeam("G1", "Bélgica", "G", 6),
      createTeam("G2", "Egipto", "G", 35),
      createTeam("G3", "Irán", "G", 20),
      createTeam("G4", "Nueva Zelanda", "G", 95),
    ],
  },
  {
    name: "H",
    teams: [
      createTeam("H1", "España", "H", 1),
      createTeam("H2", "Uruguay", "H", 14),
      createTeam("H3", "Arabia Saudita", "H", 55),
      createTeam("H4", "Cabo Verde", "H", 65),
    ],
  },
  {
    name: "I",
    teams: [
      createTeam("I1", "Francia", "I", 3),
      createTeam("I2", "Senegal", "I", 18),
      createTeam("I3", "Noruega", "I", 45),
      createTeam("I4", "FIFA Playoff 2", "I", 50, true),
    ],
  },
  {
    name: "J",
    teams: [
      createTeam("J1", "Argentina", "J", 2),
      createTeam("J2", "Austria", "J", 25),
      createTeam("J3", "Argelia", "J", 35),
      createTeam("J4", "Jordania", "J", 70),
    ],
  },
  {
    name: "K",
    teams: [
      createTeam("K1", "Portugal", "K", 8),
      createTeam("K2", "Colombia", "K", 12),
      createTeam("K3", "Uzbekistán", "K", 60),
      createTeam("K4", "FIFA Playoff 1", "K", 50, true),
    ],
  },
  {
    name: "L",
    teams: [
      createTeam("L1", "Inglaterra", "L", 4),
      createTeam("L2", "Croacia", "L", 12),
      createTeam("L3", "Ghana", "L", 60),
      createTeam("L4", "Panamá", "L", 45),
    ],
  },
];

export const INITIAL_GROUPS: Group[] = RAW_GROUPS.map((g) => ({
  ...g,
  matches: createGroupMatches(g.name, g.teams),
}));
