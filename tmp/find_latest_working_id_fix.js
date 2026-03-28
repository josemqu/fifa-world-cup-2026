
async function findLatestWorkingIdFix() {
  const url = "https://inside.fifa.com/es/fifa-world-ranking/men";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  
  const regex = /"id":"(id\d+|FRS_Male_Football_\d{8})"/g;
  const matches = [...html.matchAll(regex)];
  if (!matches.length) return null;
  
  const ids = [...new Set(matches.map(m => m[1]))];
  console.log("Candidate IDs count:", ids.length);
  
  // Test from the first one in the HTML (usually latest)
  for (const id of ids) {
    const api = `https://inside.fifa.com/api/ranking-overview?locale=es&dateId=${id}&rankingType=football&count=1`;
    try {
      const apiRes = await fetch(api, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.rankings && data.rankings.length > 0) {
           console.log(`FOUND WORKING ID: ${id}, Date: ${data.rankings[0].lastUpdateDate}`);
           return id;
        } else {
           console.log(`ID ${id} returned empty Rankings.`);
        }
      } else {
        console.log(`ID ${id} API error: ${apiRes.status}`);
      }
    } catch(e) {
      console.log(`ID ${id} Error: ${e.message}`);
    }
  }
}

findLatestWorkingIdFix();
