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
  // Add others if discovered
};

export interface RankingData {
  rank: number;
  points: number;
}

export const fetchFifaRankings = async (): Promise<
  Record<string, RankingData>
> => {
  try {
    const response = await fetch("/api/rankings");

    if (!response.ok) {
      throw new Error("Failed to fetch rankings");
    }

    const data: FifaRankingResponse = await response.json();
    const rankingMap: Record<string, RankingData> = {};

    data.rankings.forEach((item) => {
      const name = item.rankingItem.name;
      const rank = item.rankingItem.rank;
      const points = item.rankingItem.totalPoints;
      if (rank) {
        rankingMap[name] = { rank, points };
      }
    });

    return rankingMap;
  } catch (error) {
    console.error("Error fetching FIFA rankings:", error);
    return {};
  }
};

export const getRankingDataForTeam = (
  teamName: string,
  rankings: Record<string, RankingData>
): RankingData | undefined => {
  // 1. Direct match
  if (rankings[teamName]) return rankings[teamName];

  // 2. Mapped match
  const mappedName = TEAM_NAME_MAPPING[teamName];
  if (mappedName && rankings[mappedName]) return rankings[mappedName];

  // 3. Case insensitive match (fallback)
  const lowerName = teamName.toLowerCase();
  const found = Object.keys(rankings).find(
    (key) => key.toLowerCase() === lowerName
  );
  if (found) return rankings[found];

  return undefined;
};
