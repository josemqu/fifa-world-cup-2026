async function test() {
  const email = "josemqu_api@worldcup2026.com";
  const password = "securepassword123";
  const baseUrl = "https://worldcup26.ir";

  console.log("Authenticating...");
  const authRes = await fetch(`${baseUrl}/auth/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!authRes.ok) {
    console.error("Auth failed:", authRes.status, await authRes.text());
    return;
  }
  
  const authData = await authRes.json();
  const token = authData.token;
  console.log("Authenticated. Token received.");

  console.log("Fetching games...");
  const gamesRes = await fetch(`${baseUrl}/get/games`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });

  if (!gamesRes.ok) {
    console.error("Games fetch failed:", gamesRes.status, await gamesRes.text());
    return;
  }

  const data = await gamesRes.json();
  const games = data.games || [];
  console.log("Total games returned:", games.length);
  
  // Find Czech Republic or South Korea or game id 2
  const game2 = games.find(g => g.id === "2");
  console.log("Game 2 details:", JSON.stringify(game2, null, 2));

  // Print all live or halftime games
  const activeGames = games.filter(g => g.time_elapsed !== "notstarted" && g.finished !== "TRUE");
  console.log("Active games:", JSON.stringify(activeGames, null, 2));
}

test().catch(console.error);
