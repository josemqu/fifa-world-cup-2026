export interface FifaRankingItem {
  rankingItem: {
    idTeam: string;
    rank: number;
    name: string;
    countryCode: string;
    totalPoints: number;
  };
}

export interface FifaRankingResponse {
  rankings: FifaRankingItem[];
}

const TEAM_NAME_MAPPING: Record<string, string> = {
  "Estados Unidos": "EEUU",
  "Corea del Sur": "República de Corea",
  Irán: "RI de Irán",
  "Arabia Saudita": "Arabia Saudí",
  Catar: "Qatar",
  Chequia: "República Checa",
  "RD Congo": "RD del Congo",
  // Add others if discovered
};

export interface RankingData {
  rank: number;
  points: number;
}

export const fetchFifaRankings = async (): Promise<
  Map<string, RankingData>
> => {
  try {
    const response = await fetch("/api/rankings");

    if (!response.ok) {
      throw new Error("Failed to fetch rankings");
    }

    const data: FifaRankingResponse = await response.json();
    const rankingMap = new Map<string, RankingData>();

    data.rankings.forEach((item) => {
      const name = item.rankingItem.name;
      const rank = item.rankingItem.rank;
      const points = item.rankingItem.totalPoints;
      if (rank) {
        rankingMap.set(name, { rank, points });
      }
    });

    return rankingMap;
  } catch (error) {
    console.error("Error fetching FIFA rankings:", error);
    return new Map();
  }
};

export const getRankingDataForTeam = (
  teamName: string,
  rankings: Map<string, RankingData>
): RankingData | undefined => {
  // 1. Direct match
  if (rankings.has(teamName)) return rankings.get(teamName);

  // 2. Mapped match
  if (Object.prototype.hasOwnProperty.call(TEAM_NAME_MAPPING, teamName)) {
    const mappedName = TEAM_NAME_MAPPING[teamName];
    if (rankings.has(mappedName)) return rankings.get(mappedName);
  }

  // 3. Case insensitive match (fallback)
  const lowerName = teamName.toLowerCase();
  for (const [key, value] of rankings.entries()) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return undefined;
};
