import { Group, Team, Match } from "./types";

const createTeam = (
  id: string,
  name: string,
  group: string,
  isPlaceholder = false
): Team => ({
  id,
  name,
  group,
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
      createTeam("A1", "México", "A"),
      createTeam("A2", "Corea del Sur", "A"),
      createTeam("A3", "Sudáfrica", "A"),
      createTeam("A4", "UEFA Playoff D", "A", true),
    ],
  },
  {
    name: "B",
    teams: [
      createTeam("B1", "Canadá", "B"),
      createTeam("B2", "Suiza", "B"),
      createTeam("B3", "Catar", "B"),
      createTeam("B4", "UEFA Playoff A", "B", true),
    ],
  },
  {
    name: "C",
    teams: [
      createTeam("C1", "Brasil", "C"),
      createTeam("C2", "Marruecos", "C"),
      createTeam("C3", "Escocia", "C"),
      createTeam("C4", "Haití", "C"),
    ],
  },
  {
    name: "D",
    teams: [
      createTeam("D1", "Estados Unidos", "D"),
      createTeam("D2", "Australia", "D"),
      createTeam("D3", "Paraguay", "D"),
      createTeam("D4", "UEFA Playoff C", "D", true),
    ],
  },
  {
    name: "E",
    teams: [
      createTeam("E1", "Alemania", "E"),
      createTeam("E2", "Ecuador", "E"),
      createTeam("E3", "Costa de Marfil", "E"),
      createTeam("E4", "Curazao", "E"),
    ],
  },
  {
    name: "F",
    teams: [
      createTeam("F1", "Países Bajos", "F"),
      createTeam("F2", "Japón", "F"),
      createTeam("F3", "Túnez", "F"),
      createTeam("F4", "UEFA Playoff B", "F", true),
    ],
  },
  {
    name: "G",
    teams: [
      createTeam("G1", "Bélgica", "G"),
      createTeam("G2", "Egipto", "G"),
      createTeam("G3", "Irán", "G"),
      createTeam("G4", "Nueva Zelanda", "G"),
    ],
  },
  {
    name: "H",
    teams: [
      createTeam("H1", "España", "H"),
      createTeam("H2", "Uruguay", "H"),
      createTeam("H3", "Arabia Saudita", "H"),
      createTeam("H4", "Cabo Verde", "H"),
    ],
  },
  {
    name: "I",
    teams: [
      createTeam("I1", "Francia", "I"),
      createTeam("I2", "Senegal", "I"),
      createTeam("I3", "Noruega", "I"),
      createTeam("I4", "FIFA Playoff 2", "I", true),
    ],
  },
  {
    name: "J",
    teams: [
      createTeam("J1", "Argentina", "J"),
      createTeam("J2", "Austria", "J"),
      createTeam("J3", "Argelia", "J"),
      createTeam("J4", "Jordania", "J"),
    ],
  },
  {
    name: "K",
    teams: [
      createTeam("K1", "Portugal", "K"),
      createTeam("K2", "Colombia", "K"),
      createTeam("K3", "Uzbekistán", "K"),
      createTeam("K4", "FIFA Playoff 1", "K", true),
    ],
  },
  {
    name: "L",
    teams: [
      createTeam("L1", "Inglaterra", "L"),
      createTeam("L2", "Croacia", "L"),
      createTeam("L3", "Ghana", "L"),
      createTeam("L4", "Panamá", "L"),
    ],
  },
];

export const INITIAL_GROUPS: Group[] = RAW_GROUPS.map((g) => ({
  ...g,
  matches: createGroupMatches(g.name, g.teams),
}));
