
async function probeMoreIds() {
  const steps = [14870, 14933, 15000, 15100, 15200, 15300, 15400, 15500];
  for (const baseId of steps) {
    for (let i = 0; i < 50; i++) {
        const id = `id${baseId + i}`;
        const url = `https://inside.fifa.com/api/ranking-overview?locale=es&dateId=${id}&rankingType=football`;
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
}

probeMoreIds();
