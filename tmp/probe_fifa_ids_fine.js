
async function probeIdsFine() {
  for (let i = 14934; i < 15100; i++) {
    const id = `id${i}`;
    const url = `https://inside.fifa.com/api/ranking-overview?locale=es&dateId=${id}&rankingType=football&count=1`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        const data = await res.json();
        if (data.rankings && data.rankings.length > 0) {
          const date = data.rankings[0].lastUpdateDate;
          console.log(`ID: ${id}, Date: ${date}`);
        }
      }
    } catch(e) {}
  }
}

probeIdsFine();
