
async function findLatestWorkingId() {
  const url = "https://inside.fifa.com/es/fifa-world-ranking/men";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  
  // Look for both idXXXXX and FRS_Male_Football_YYYYMMDD
  const regex = /"id":"(id\d{5}|FRS_Male_Football_\d{8})"/g;
  const matches = [...html.matchAll(regex)];
  if (!matches.length) return null;
  
  const ids = [...new Set(matches.map(m => m[1]))];
  console.log("Candidate IDs found:", ids);
  
  // Test them in reverse order (assuming they are chronological)
  for (const id of ids.reverse()) {
    const api = `https://inside.fifa.com/api/ranking-overview?locale=es&dateId=${id}&rankingType=football&count=1`;
    try {
      const apiRes = await fetch(api, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.rankings && data.rankings.length > 0) {
           console.log(`FOUND WORKING ID: ${id}, Date: ${data.rankings[0].lastUpdateDate}`);
           return id;
        }
      }
    } catch(e) {}
  }
}

findLatestWorkingId();
