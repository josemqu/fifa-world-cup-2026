import "./loadEnv";
import connectDB from "../lib/mongodb";
import LiveScore from "../models/LiveScore";

async function main() {
  console.log("Connecting to DB...");
  await connectDB();
  console.log("Connected.");

  const scores = await LiveScore.find({ status: { $ne: "scheduled" } }).lean();
  console.log(`Found ${scores.length} matches with status != "scheduled":`);
  scores.forEach(s => {
    console.log(`Match ${s.matchId}: ${s.homeTeamName} vs ${s.awayTeamName}, Status = ${s.status}, Score = ${s.homeScore}-${s.awayScore}`);
  });
  
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
