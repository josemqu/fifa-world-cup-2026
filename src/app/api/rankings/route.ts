import { NextResponse } from "next/server";

const FALLBACK_DATE_ID = "id14933"; // Nov 19, 2025

async function getLatestDateId(): Promise<string> {
  try {
    const response = await fetch(
      "https://inside.fifa.com/es/fifa-world-ranking/men",
      {
        next: { revalidate: 86400 }, // Revalidate every 24 hours
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    );

    if (!response.ok) return FALLBACK_DATE_ID;

    const html = await response.text();
    const regex = /"id":"(id\d{5})"/g;
    const matches = [...html.matchAll(regex)];

    if (matches && matches.length > 0) {
      const ids = matches.map((m) => m[1]);
      // Sort numerically descending to get the highest (most recent) ID
      const sortedIds = ids.sort((a, b) => b.localeCompare(a));
      return sortedIds[0];
    }
  } catch (error) {
    console.error("Error discovering latest FIFA dateId:", error);
  }
  return FALLBACK_DATE_ID;
}

export async function GET() {
  try {
    const dateId = await getLatestDateId();

    const response = await fetch(
      `https://inside.fifa.com/api/ranking-overview?locale=es&dateId=${dateId}&rankingType=football`,
      {
        next: { revalidate: 86400 }, // Rankings don't change often
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch rankings from FIFA with dateId ${dateId}`, response);
      return NextResponse.json(
        { error: "Failed to fetch rankings from FIFA" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Internal Server Error in rankings API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
