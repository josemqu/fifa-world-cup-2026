import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://inside.fifa.com/api/ranking-overview?locale=es&dateId=id14933&rankingType=football",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch rankings from FIFA", response);
      return NextResponse.json(
        { error: "Failed to fetch rankings from FIFA" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("FIFA rankings fetched successfully", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching FIFA rankings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
