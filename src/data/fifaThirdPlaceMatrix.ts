// Predetermined combination matrix from FIFA regulations (Annex C)
// Maps each of the 495 combinations of the 8 qualified third-placed teams
// to the specific matchups in the Round of 32 for winners A, B, D, E, G, I, K, L.

export type ThirdPlaceMatrixEntry = {
  id: number;
  groups: string[];
  matchups: { [winner: string]: string };
};

export const FIFA_THIRD_PLACE_MATRIX: ThirdPlaceMatrixEntry[] = [
  {
    "id": 1,
    "groups": [
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "F",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 2,
    "groups": [
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 3,
    "groups": [
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 4,
    "groups": [
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 5,
    "groups": [
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 6,
    "groups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 7,
    "groups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 8,
    "groups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 9,
    "groups": [
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 10,
    "groups": [
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 11,
    "groups": [
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 12,
    "groups": [
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 13,
    "groups": [
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 14,
    "groups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 15,
    "groups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 16,
    "groups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 17,
    "groups": [
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 18,
    "groups": [
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 19,
    "groups": [
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 20,
    "groups": [
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 21,
    "groups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 22,
    "groups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 23,
    "groups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 24,
    "groups": [
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 25,
    "groups": [
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 26,
    "groups": [
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 27,
    "groups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 28,
    "groups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 29,
    "groups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 30,
    "groups": [
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 31,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 32,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 33,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "I",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 34,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 35,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 36,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 37,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 38,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 39,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 40,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 41,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 42,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 43,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 44,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 45,
    "groups": [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 46,
    "groups": [
      "B",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 47,
    "groups": [
      "B",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "B",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 48,
    "groups": [
      "B",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 49,
    "groups": [
      "B",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 50,
    "groups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 51,
    "groups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "F",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 52,
    "groups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 53,
    "groups": [
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "H",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 54,
    "groups": [
      "B",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 55,
    "groups": [
      "B",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 56,
    "groups": [
      "B",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 57,
    "groups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 58,
    "groups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 59,
    "groups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 60,
    "groups": [
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 61,
    "groups": [
      "B",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 62,
    "groups": [
      "B",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 63,
    "groups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 64,
    "groups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 65,
    "groups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 66,
    "groups": [
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 67,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 68,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 69,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 70,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 71,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 72,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 73,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 74,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 75,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 76,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 77,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 78,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 79,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 80,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 81,
    "groups": [
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 82,
    "groups": [
      "B",
      "C",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 83,
    "groups": [
      "B",
      "C",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 84,
    "groups": [
      "B",
      "C",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 85,
    "groups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 86,
    "groups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 87,
    "groups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 88,
    "groups": [
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 89,
    "groups": [
      "B",
      "C",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 90,
    "groups": [
      "B",
      "C",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 91,
    "groups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 92,
    "groups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 93,
    "groups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 94,
    "groups": [
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 95,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 96,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 97,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 98,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 99,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 100,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 101,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 102,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 103,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 104,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 105,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 106,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 107,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 108,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 109,
    "groups": [
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 110,
    "groups": [
      "B",
      "C",
      "D",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 111,
    "groups": [
      "B",
      "C",
      "D",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 112,
    "groups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 113,
    "groups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 114,
    "groups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 115,
    "groups": [
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 116,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 117,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 118,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "I",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 119,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 120,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 121,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 122,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 123,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 124,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 125,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 126,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 127,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "D",
      "L": "K"
    }
  },
  {
    "id": 128,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 129,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 130,
    "groups": [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "D",
      "L": "I"
    }
  },
  {
    "id": 131,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 132,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 133,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 134,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 135,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 136,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 137,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "I",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 138,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 139,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 140,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 141,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 142,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 143,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 144,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "H",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 145,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "D",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 146,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "E",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 147,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 148,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "E",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 149,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "E",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 150,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 151,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 152,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 153,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 154,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 155,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 156,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "E",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 157,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 158,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 159,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "E",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 160,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "E",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 161,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "J",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 162,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 163,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 164,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "J",
      "I": "F",
      "K": "D",
      "L": "E"
    }
  },
  {
    "id": 165,
    "groups": [
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "H",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 166,
    "groups": [
      "A",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "I",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 167,
    "groups": [
      "A",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "A",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 168,
    "groups": [
      "A",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 169,
    "groups": [
      "A",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 170,
    "groups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 171,
    "groups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 172,
    "groups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 173,
    "groups": [
      "A",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 174,
    "groups": [
      "A",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 175,
    "groups": [
      "A",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 176,
    "groups": [
      "A",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 177,
    "groups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 178,
    "groups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 179,
    "groups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 180,
    "groups": [
      "A",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 181,
    "groups": [
      "A",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 182,
    "groups": [
      "A",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 183,
    "groups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 184,
    "groups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 185,
    "groups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 186,
    "groups": [
      "A",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 187,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 188,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 189,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 190,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 191,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 192,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 193,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 194,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 195,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 196,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 197,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 198,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 199,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 200,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 201,
    "groups": [
      "A",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 202,
    "groups": [
      "A",
      "C",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 203,
    "groups": [
      "A",
      "C",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 204,
    "groups": [
      "A",
      "C",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 205,
    "groups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 206,
    "groups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 207,
    "groups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 208,
    "groups": [
      "A",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 209,
    "groups": [
      "A",
      "C",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 210,
    "groups": [
      "A",
      "C",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 211,
    "groups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 212,
    "groups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 213,
    "groups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 214,
    "groups": [
      "A",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 215,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 216,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 217,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 218,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 219,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 220,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 221,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 222,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 223,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 224,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 225,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 226,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 227,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 228,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 229,
    "groups": [
      "A",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 230,
    "groups": [
      "A",
      "C",
      "D",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 231,
    "groups": [
      "A",
      "C",
      "D",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 232,
    "groups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 233,
    "groups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 234,
    "groups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 235,
    "groups": [
      "A",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 236,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 237,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 238,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "F",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 239,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 240,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 241,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 242,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 243,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 244,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 245,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 246,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "H"
    }
  },
  {
    "id": 247,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "K"
    }
  },
  {
    "id": 248,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 249,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 250,
    "groups": [
      "A",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "I"
    }
  },
  {
    "id": 251,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 252,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 253,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 254,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 255,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 256,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 257,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "I",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 258,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 259,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 260,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 261,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 262,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 263,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 264,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 265,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 266,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 267,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "I",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 268,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 269,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 270,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 271,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 272,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "K"
    }
  },
  {
    "id": 273,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 274,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 275,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "I"
    }
  },
  {
    "id": 276,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 277,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 278,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 279,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 280,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "E",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 281,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "J",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 282,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "F",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 283,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "K"
    }
  },
  {
    "id": 284,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "J",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "E"
    }
  },
  {
    "id": 285,
    "groups": [
      "A",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "E",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "I"
    }
  },
  {
    "id": 286,
    "groups": [
      "A",
      "B",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 287,
    "groups": [
      "A",
      "B",
      "F",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 288,
    "groups": [
      "A",
      "B",
      "F",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 289,
    "groups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 290,
    "groups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 291,
    "groups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 292,
    "groups": [
      "A",
      "B",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 293,
    "groups": [
      "A",
      "B",
      "E",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 294,
    "groups": [
      "A",
      "B",
      "E",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 295,
    "groups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 296,
    "groups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 297,
    "groups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "H",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 298,
    "groups": [
      "A",
      "B",
      "E",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "H",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 299,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 300,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 301,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 302,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 303,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 304,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 305,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 306,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 307,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 308,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 309,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 310,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 311,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 312,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 313,
    "groups": [
      "A",
      "B",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 314,
    "groups": [
      "A",
      "B",
      "D",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 315,
    "groups": [
      "A",
      "B",
      "D",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 316,
    "groups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 317,
    "groups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 318,
    "groups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 319,
    "groups": [
      "A",
      "B",
      "D",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 320,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 321,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 322,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "I",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 323,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 324,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 325,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "F",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 326,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 327,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "F",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 328,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "F",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 329,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 330,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 331,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "J",
      "L": "K"
    }
  },
  {
    "id": 332,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 333,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 334,
    "groups": [
      "A",
      "B",
      "D",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "J"
    }
  },
  {
    "id": 335,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 336,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 337,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 338,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 339,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 340,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 341,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 342,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 343,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 344,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 345,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 346,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 347,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 348,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 349,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 350,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 351,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 352,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 353,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 354,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 355,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 356,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 357,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 358,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 359,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 360,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 361,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 362,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "J",
      "L": "K"
    }
  },
  {
    "id": 363,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 364,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 365,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "J"
    }
  },
  {
    "id": 366,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 367,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 368,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "J"
    }
  },
  {
    "id": 369,
    "groups": [
      "A",
      "B",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 370,
    "groups": [
      "A",
      "B",
      "C",
      "H",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 371,
    "groups": [
      "A",
      "B",
      "C",
      "G",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 372,
    "groups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 373,
    "groups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 374,
    "groups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 375,
    "groups": [
      "A",
      "B",
      "C",
      "G",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 376,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 377,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 378,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "I",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 379,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 380,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 381,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 382,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 383,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 384,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "F",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 385,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 386,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 387,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "J",
      "L": "K"
    }
  },
  {
    "id": 388,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 389,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 390,
    "groups": [
      "A",
      "B",
      "C",
      "F",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "J"
    }
  },
  {
    "id": 391,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "C",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 392,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 393,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 394,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 395,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 396,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 397,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "A",
      "G": "I",
      "I": "C",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 398,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 399,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 400,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 401,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 402,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 403,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 404,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "H",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 405,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "G",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 406,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 407,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 408,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 409,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 410,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 411,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 412,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 413,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 414,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 415,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 416,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 417,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 418,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "J",
      "L": "K"
    }
  },
  {
    "id": 419,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 420,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 421,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "I",
      "J"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "J"
    }
  },
  {
    "id": 422,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 423,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 424,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "J"
    }
  },
  {
    "id": 425,
    "groups": [
      "A",
      "B",
      "C",
      "E",
      "F",
      "G",
      "H",
      "I"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 426,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "I",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 427,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 428,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "I",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 429,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 430,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "H",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 431,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 432,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "I",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 433,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 434,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "G",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 435,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 436,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 437,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "J",
      "L": "K"
    }
  },
  {
    "id": 438,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 439,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 440,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "G",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "J"
    }
  },
  {
    "id": 441,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 442,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "I",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 443,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 444,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 445,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "F",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 446,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "H"
    }
  },
  {
    "id": 447,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "K"
    }
  },
  {
    "id": 448,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "F",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 449,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "F",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 450,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "I"
    }
  },
  {
    "id": 451,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 452,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 453,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "J",
      "L": "K"
    }
  },
  {
    "id": 454,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 455,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 456,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "I",
      "J"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "J"
    }
  },
  {
    "id": 457,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "H"
    }
  },
  {
    "id": 458,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "K"
    }
  },
  {
    "id": 459,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "J"
    }
  },
  {
    "id": 460,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "I"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "I"
    }
  },
  {
    "id": 461,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "J",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 462,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "I",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "I",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 463,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "I",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 464,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "I",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 465,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "K",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 466,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "J",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 467,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "J",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 468,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 469,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 470,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 471,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "K",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 472,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "J",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "J"
    }
  },
  {
    "id": 473,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "J",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "J",
      "L": "K"
    }
  },
  {
    "id": 474,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "L"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 475,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "K"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 476,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "I",
      "J"
    ],
    "matchups": {
      "A": "E",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "I",
      "L": "J"
    }
  },
  {
    "id": 477,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 478,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 479,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "E",
      "L": "J"
    }
  },
  {
    "id": 480,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "I"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 481,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "K",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "K"
    }
  },
  {
    "id": 482,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "J",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 483,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "J",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 484,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "I"
    }
  },
  {
    "id": 485,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "E",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "I",
      "L": "K"
    }
  },
  {
    "id": 486,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "I",
      "J"
    ],
    "matchups": {
      "A": "C",
      "B": "J",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 487,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "L"
    ],
    "matchups": {
      "A": "H",
      "B": "F",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "D",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 488,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "K"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "K"
    }
  },
  {
    "id": 489,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "J"
    ],
    "matchups": {
      "A": "H",
      "B": "J",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "E"
    }
  },
  {
    "id": 490,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "H",
      "I"
    ],
    "matchups": {
      "A": "H",
      "B": "E",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "I"
    }
  },
  {
    "id": 491,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "L"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "L",
      "L": "E"
    }
  },
  {
    "id": 492,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "K"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "K"
    }
  },
  {
    "id": 493,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "J"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "J"
    }
  },
  {
    "id": 494,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "I"
    ],
    "matchups": {
      "A": "C",
      "B": "G",
      "D": "B",
      "E": "D",
      "G": "A",
      "I": "F",
      "K": "E",
      "L": "I"
    }
  },
  {
    "id": 495,
    "groups": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H"
    ],
    "matchups": {
      "A": "H",
      "B": "G",
      "D": "B",
      "E": "C",
      "G": "A",
      "I": "F",
      "K": "D",
      "L": "E"
    }
  }
];
