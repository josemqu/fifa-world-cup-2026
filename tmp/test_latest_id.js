
async function testRankingAndDates() {
  const url = "https://inside.fifa.com/es/fifa-world-ranking/men";
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await response.text();
    const regex = /"id":"(id\d{5})"/g;
    const matches = [...html.matchAll(regex)];
    const ids = matches.map(m => m[1]);
    const latestId = ids[0] || "id14933";
    console.log("Latest ID found:", latestId);

    const rankingUrl = `https://inside.fifa.com/api/ranking-overview?locale=es&dateId=${latestId}&rankingType=football`;
    const rankingRes = await fetch(rankingUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const rankingData = await rankingRes.json();
    console.log("Rankings count:", rankingData.rankings.length);
    if (rankingData.rankings.length > 0) {
      console.log("First item:", rankingData.rankings[0].rankingItem.name, "Date:", rankingData.rankings[0].lastUpdateDate);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

testRankingAndDates();
