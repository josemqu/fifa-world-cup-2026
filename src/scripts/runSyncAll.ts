import "./loadEnv";
import connectDB from "../lib/mongodb";
import LiveScore from "../models/LiveScore";
import { fetchFixtures, normalizeFixtures } from "../services/liveScores";

async function main() {
  console.log("Connecting to DB...");
  await connectDB();
  console.log("Connected.");

  console.log("Fetching all fixtures...");
  const fixtures = await fetchFixtures(undefined);
  console.log(`Fetched ${fixtures.length} fixtures.`);

  console.log("Normalizing fixtures...");
  const normalized = normalizeFixtures(fixtures);
  console.log(`Normalized ${normalized.length} fixtures.`);

  let updatedCount = 0;
  for (const score of normalized) {
    console.log(`Updating Match ${score.matchId} (${score.homeTeamName} vs ${score.awayTeamName}):`, {
      homeScorersCount: score.homeScorers?.length || 0,
      awayScorersCount: score.awayScorers?.length || 0,
    });
    
    await LiveScore.findOneAndUpdate(
      { matchId: score.matchId },
      {
        $set: {
          homeScorers: score.homeScorers || [],
          awayScorers: score.awayScorers || [],
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          status: score.status,
          elapsed: score.elapsed,
          lastSyncAt: new Date(),
        }
      },
      { upsert: true }
    );
    updatedCount++;
  }

  console.log(`Finished. Updated ${updatedCount} matches.`);
  process.exit(0);
}

main().catch(err => {
  console.error("Error running sync all:", err);
  process.exit(1);
});
