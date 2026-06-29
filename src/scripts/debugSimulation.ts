import { INITIAL_GROUPS } from "../data/initialData";
import { simulateTournament, propagateKnockoutTeams } from "../utils/simulationUtils";
import { calculateKnockoutProbabilities } from "../utils/probabilityUtils";
import { generateR32Matches } from "../utils/knockoutUtils";
import { KnockoutMatch, Team } from "../data/types";

function runDebug() {
  console.log("=== STEP 1: Simulate Tournament (looping for tie final) ===");
  let result;
  let finalMatch;
  let attempts = 0;
  
  while (attempts < 1000) {
    result = simulateTournament(INITIAL_GROUPS, []);
    finalMatch = result.knockoutMatches.find(m => m.id === "104");
    if (finalMatch && finalMatch.homeScore === finalMatch.awayScore) {
      break;
    }
    attempts++;
  }
  
  console.log(`Found tie final match after ${attempts} attempts:`);
  console.log("Home Team:", finalMatch?.homeTeam ? (finalMatch.homeTeam as Team).name : "null");
  console.log("Away Team:", finalMatch?.awayTeam ? (finalMatch.awayTeam as Team).name : "null");
  console.log("Home Score:", finalMatch?.homeScore);
  console.log("Away Score:", finalMatch?.awayScore);
  console.log("Home Penalties:", finalMatch?.homePenalties);
  console.log("Away Penalties:", finalMatch?.awayPenalties);
  console.log("Winner:", finalMatch?.winner ? (finalMatch.winner as Team).name : "null");

  console.log("\n=== STEP 2: Running propagation effect ===");
  // This simulates the useEffect(() => { ... }, [groups])
  const r32 = generateR32Matches(result!.groups);
  const prev = result!.knockoutMatches;

  const getTeamIdentifier = (team: any) => {
    if (!team) return "";
    return "placeholder" in team ? team.placeholder : team.id;
  };

  const updatedR32 = r32.map((newMatch) => {
    const existing = prev.find((m) => m.id === newMatch.id);

    const homeChanged =
      getTeamIdentifier(existing?.homeTeam) !==
      getTeamIdentifier(newMatch.homeTeam);
    const awayChanged =
      getTeamIdentifier(existing?.awayTeam) !==
      getTeamIdentifier(newMatch.awayTeam);

    if (existing && !homeChanged && !awayChanged) {
      return {
        ...newMatch,
        ...existing,
        homeTeam: newMatch.homeTeam,
        awayTeam: newMatch.awayTeam,
      };
    }

    const hasScoreData = existing && (existing.homeScore !== null || existing.awayScore !== null);
    if (existing && hasScoreData) {
      return {
        ...newMatch,
        ...existing,
        homeTeam: newMatch.homeTeam,
        awayTeam: newMatch.awayTeam,
      };
    }

    return {
      ...newMatch,
      stage: "R32",
      homeScore: null,
      awayScore: null,
      winner: null,
    } as KnockoutMatch;
  });

  const nonR32 = prev
    .filter((m) => m.stage !== "R32")
    .map((m) => {
      return m;
    });

  const combined = [...updatedR32, ...nonR32];

  const propagated = propagateKnockoutTeams(combined);
  const finalMatchAfterProp = propagated.find(m => m.id === "104");
  console.log("Final match (104) after propagation:");
  console.log("Winner:", finalMatchAfterProp?.winner ? (finalMatchAfterProp.winner as Team).name : "null");
  console.log("Home Penalties:", finalMatchAfterProp?.homePenalties);
  console.log("Away Penalties:", finalMatchAfterProp?.awayPenalties);

  console.log("\n=== STEP 3: Running probability calculation ===");
  calculateKnockoutProbabilities(result!.groups, propagated).then((probs) => {



    const probFinal = probs.get("104");
    console.log("Probability of final match (104):", probFinal);

    // Auto-assignment logic
    let matchesChanged = false;
    const resolvedMatches = propagated.map((m) => {
      let homeTeam = m.homeTeam;
      let awayTeam = m.awayTeam;
      const prob = probs.get(m.id);

      if (prob) {
        if (
          (!homeTeam || "placeholder" in homeTeam) &&
          prob.projectedHomeTeam &&
          prob.homeTeamProb === 1
        ) {
          homeTeam = prob.projectedHomeTeam;
          matchesChanged = true;
          console.log(`Match ${m.id}: Auto-assign Home Team to`, (homeTeam as Team).name);
        }

        if (
          (!awayTeam || "placeholder" in awayTeam) &&
          prob.projectedAwayTeam &&
          prob.awayTeamProb === 1
        ) {
          awayTeam = prob.projectedAwayTeam;
          matchesChanged = true;
          console.log(`Match ${m.id}: Auto-assign Away Team to`, (awayTeam as Team).name);
        }
      }

      if (homeTeam !== m.homeTeam || awayTeam !== m.awayTeam) {
        return {
          ...m,
          homeTeam,
          awayTeam,
        };
      }
      return m;
    });

    console.log("matchesChanged:", matchesChanged);
    if (matchesChanged) {
      const finalProp = propagateKnockoutTeams(resolvedMatches);
      const finalMatchFinal = finalProp.find(m => m.id === "104");
      console.log("Final match (104) after auto-assign propagation:");
      console.log("Winner:", finalMatchFinal?.winner ? (finalMatchFinal.winner as Team).name : "null");
    } else {
      console.log("No propagation run since matchesChanged is false");
    }
  });
}

runDebug();
