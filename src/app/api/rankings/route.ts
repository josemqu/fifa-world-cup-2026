import { NextResponse } from "next/server";

// FIFA Live Ranking API (Dynamic)
const LIVE_RANKING_URL = "https://api.fifa.com/api/v3/fifarankings/rankings/live?gender=1&sportType=0&language=es";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(LIVE_RANKING_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Failed to fetch live rankings from FIFA`, response.status);
      return NextResponse.json(
        { error: "Failed to fetch rankings from FIFA" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Map the "Live" API response to the format expected by rankingUtils.ts
    // The Live API uses "Results" array, internal API used "rankings"
    const mappedRankings = (data.Results || []).map((item: any) => ({
      rankingItem: {
        idTeam: item.IdCountry || item.IdTeam,
        rank: item.Rank,
        name: item.TeamName?.[0]?.Description || "Unknown",
        countryCode: item.IdCountry,
        totalPoints: item.TotalPoints,
      },
    }));

    return NextResponse.json({ rankings: mappedRankings });
  } catch (error) {
    console.error("Internal Server Error in rankings API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
