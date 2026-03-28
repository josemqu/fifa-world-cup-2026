
async function probeIds() {
  const baseId = 14933; // Nov 2025
  for (let i = 0; i < 500; i++) {
    const id = `id${baseId + i}`;
    const url = `https://inside.fifa.com/api/ranking-overview?locale=es&dateId=${id}&rankingType=football`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        const data = await res.json();
        if (data.rankings && data.rankings.length > 0) {
          const date = data.rankings[0].lastUpdateDate;
          console.log(`ID: ${id}, Length: ${data.rankings.length}, Date: ${date}`);
        }
      }
    } catch(e) {}
  }
}

probeIds();
