export type ThirdPlaceCombination = {
  id: number;
  groups: string[]; // Array of group names that qualify (e.g., ['A', 'B', ...])
  matchups: {
    [key: string]: string; // 'A' -> 'H' means 1°A plays 3°H
  };
};

export const THIRD_PLACE_MATRIX: ThirdPlaceCombination[] = [
  {
    id: 1,
    groups: ["A", "B", "C", "D", "E", "F", "G", "H"],
    matchups: { A: "H", B: "G", C: "F", D: "E", E: "D", F: "C", G: "B" },
  },
  {
    id: 2,
    groups: ["A", "B", "C", "D", "E", "F", "G", "I"],
    matchups: { A: "I", B: "G", C: "F", D: "E", E: "D", F: "C", G: "B" },
  },
  {
    id: 3,
    groups: ["A", "B", "C", "D", "E", "F", "G", "J"],
    matchups: { A: "J", B: "G", C: "F", D: "E", E: "D", F: "C", G: "B" },
  },
  {
    id: 4,
    groups: ["A", "B", "C", "D", "E", "F", "G", "K"],
    matchups: { A: "K", B: "G", C: "F", D: "E", E: "D", F: "C", G: "B" },
  },
  {
    id: 5,
    groups: ["A", "B", "C", "D", "E", "F", "G", "L"],
    matchups: { A: "L", B: "G", C: "F", D: "E", E: "D", F: "C", G: "B" },
  },
  {
    id: 6,
    groups: ["A", "B", "C", "D", "E", "F", "H", "I"],
    matchups: { A: "H", B: "I", C: "F", D: "E", E: "D", F: "C" },
  },
  {
    id: 7,
    groups: ["A", "B", "C", "D", "E", "F", "H", "J"],
    matchups: { A: "J", B: "H", C: "F", D: "E", E: "D", F: "C" },
  },
  {
    id: 8,
    groups: ["A", "B", "C", "D", "E", "F", "I", "J"],
    matchups: { A: "J", B: "I", C: "F", D: "E", E: "D", F: "C" },
  },
  {
    id: 9,
    groups: ["A", "B", "C", "D", "E", "G", "H", "I"],
    matchups: { A: "I", B: "H", C: "G", D: "E", E: "D", G: "A" },
  },
  {
    id: 10,
    groups: ["A", "B", "C", "D", "E", "G", "H", "J"],
    matchups: { A: "J", B: "H", C: "G", D: "E", E: "D", G: "A" },
  },
  {
    id: 11,
    groups: ["A", "B", "C", "D", "E", "G", "I", "J"],
    matchups: { A: "J", B: "I", C: "G", D: "E", E: "D", G: "A" },
  },
  {
    id: 12,
    groups: ["A", "B", "C", "D", "F", "G", "H", "I"],
    matchups: { A: "I", B: "H", C: "G", D: "F", F: "D", G: "A" },
  },
  {
    id: 13,
    groups: ["A", "B", "C", "D", "F", "G", "H", "J"],
    matchups: { A: "J", B: "H", C: "G", D: "F", F: "D", G: "A" },
  },
  {
    id: 14,
    groups: ["A", "B", "C", "D", "F", "G", "I", "J"],
    matchups: { A: "J", B: "I", C: "G", D: "F", F: "D", G: "A" },
  },
  {
    id: 15,
    groups: ["E", "F", "G", "H", "I", "J", "K", "L"],
    matchups: {
      E: "L",
      F: "K",
      G: "J",
      H: "I",
      I: "H",
      J: "G",
      K: "F",
      L: "E",
    },
  },
];

// Structure for R32 Matches
// Variable matches will look up the opponent from the matrix
export const R32_MATCHES = [
  { id: "73", type: "fixed", home: "2A", away: "2B", next: "89" },
  {
    id: "74",
    type: "variable",
    home: "1E",
    away: "3?",
    possibilities: ["A", "B", "C", "D", "F"],
    next: "89",
  }, // 1°E vs 3° (A/B/C/D/F) - Look up 'E' in matrix
  { id: "75", type: "fixed", home: "1F", away: "2C", next: "90" },
  { id: "76", type: "fixed", home: "1C", away: "2F", next: "90" },
  {
    id: "77",
    type: "variable",
    home: "1I",
    away: "3?",
    possibilities: ["C", "D", "F", "G", "H"],
    next: "91",
  }, // 1°I vs 3° (C/D/F/G/H) - Look up 'I' in matrix
  { id: "78", type: "fixed", home: "2E", away: "2I", next: "91" },
  {
    id: "79",
    type: "variable",
    home: "1A",
    away: "3?",
    possibilities: ["C", "E", "F", "H", "I"],
    next: "92",
  }, // 1°A vs 3° (C/E/F/H/I) - Look up 'A' in matrix
  {
    id: "80",
    type: "variable",
    home: "1L",
    away: "3?",
    possibilities: ["E", "H", "I", "J", "K"],
    next: "92",
  }, // 1°L vs 3° (E/H/I/J/K) - Look up 'L' in matrix
  {
    id: "81",
    type: "variable",
    home: "1D",
    away: "3?",
    possibilities: ["B", "E", "F", "I", "J"],
    next: "93",
  }, // 1°D vs 3° (B/E/F/I/J) - Look up 'D' in matrix
  {
    id: "82",
    type: "variable",
    home: "1G",
    away: "3?",
    possibilities: ["A", "E", "H", "I", "J"],
    next: "93",
  }, // 1°G vs 3° (A/E/H/I/J) - Look up 'G' in matrix
  { id: "83", type: "fixed", home: "2K", away: "2L", next: "94" },
  { id: "84", type: "fixed", home: "1H", away: "2J", next: "94" },
  {
    id: "85",
    type: "variable",
    home: "1B",
    away: "3?",
    possibilities: ["E", "F", "G", "I", "J"],
    next: "95",
  }, // 1°B vs 3° (E/F/G/I/J) - Look up 'B' in matrix
  { id: "86", type: "fixed", home: "1J", away: "2H", next: "95" },
  {
    id: "87",
    type: "variable",
    home: "1K",
    away: "3?",
    possibilities: ["D", "E", "I", "J", "L"],
    next: "96",
  }, // 1°K vs 3° (D/E/I/J/L) - Look up 'K' in matrix
  { id: "88", type: "fixed", home: "2D", away: "2G", next: "96" },
];

export const R16_MATCHES = [
  { id: "89", home: "W73", away: "W74", next: "97" },
  { id: "90", home: "W75", away: "W76", next: "97" },
  { id: "91", home: "W77", away: "W78", next: "98" },
  { id: "92", home: "W79", away: "W80", next: "98" },
  { id: "93", home: "W81", away: "W82", next: "99" },
  { id: "94", home: "W83", away: "W84", next: "99" },
  { id: "95", home: "W85", away: "W86", next: "100" },
  { id: "96", home: "W87", away: "W88", next: "100" },
];

export const QF_MATCHES = [
  { id: "97", home: "W89", away: "W90", next: "101" },
  { id: "98", home: "W91", away: "W92", next: "101" },
  { id: "99", home: "W93", away: "W94", next: "102" },
  { id: "100", home: "W95", away: "W96", next: "102" },
];

export const SF_MATCHES = [
  { id: "101", home: "W97", away: "W98", next: "104" }, // Loser to 103
  { id: "102", home: "W99", away: "W100", next: "104" },
];

export const FINAL_MATCHES = [
  { id: "103", home: "L101", away: "L102", next: null, label: "Tercer Puesto" },
  { id: "104", home: "W101", away: "W102", next: null, label: "Final" },
];
