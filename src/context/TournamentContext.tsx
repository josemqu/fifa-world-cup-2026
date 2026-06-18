"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Group, Team, KnockoutMatch, MatchupData, Scorer } from "@/data/types";
import { INITIAL_GROUPS } from "@/data/initialData";
import { generateR32Matches } from "@/utils/knockoutUtils";
import { fetchFifaRankings, getRankingDataForTeam } from "@/utils/rankingUtils";
import {
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";
import {
  getInitialKnockoutMatches,
  runKnockoutSimulation,
  recalculateGroupStats,
  predictMatchScore,
  simulateTournament,
  propagateKnockoutTeams,
} from "@/utils/simulationUtils";
import { PredictionResult } from "@/utils/monteCarlo";

interface TournamentContextType {
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
  
  // Unified simulation data
  predictions: PredictionResult[];
  matchupResults: MatchupData[];
  simulationIterations: number;
  simulationTime: number;
  setSimulationResults: (
    predictions: PredictionResult[],
    matchupResults: MatchupData[],
    knockoutProbabilities: Record<string, any>,
    iterations: number,
    time: number
  ) => void;
  clearSimulationResults: () => void;
  isSimulationStale: boolean;
  
  // Compatibility aliases
  predictionIterations: number;
  predictionTime: number;
  setPredictions: (results: PredictionResult[], iterations: number, time: number) => void;
  clearPredictions: () => void;
  updateMatch: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
    homeScorers?: Scorer[],
    awayScorers?: Scorer[],
  ) => void;
  updateKnockoutMatch: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
    homeScorers?: Scorer[],
    awayScorers?: Scorer[],
  ) => void;
  simulateGroups: () => void;
  simulateKnockout: () => void;
  simulateAll: () => void;
  resetTournament: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined,
);

function getTournamentScoresHash(groups: Group[], knockoutMatches: KnockoutMatch[]): string {
  // Serialize group matches scores
  const groupScores = groups
    .flatMap((g) => g.matches)
    .map((m) => `${m.id}:${m.homeScore ?? ""}-${m.awayScore ?? ""}`)
    .join(",");

  // Serialize knockout matches scores
  const knockoutScores = knockoutMatches
    .map((m) => `${m.id}:${m.homeScore ?? ""}-${m.awayScore ?? ""}`)
    .join(",");

  return `${groupScores}|${knockoutScores}`;
}

function getEffectiveNow(): Date {
  let now = new Date();
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const querySim = params.get("simulatedTime");
      const localSim = window.localStorage.getItem("simulatedTime");
      const simVal = querySim || localSim;
      if (simVal) {
        const d = new Date(simVal);
        if (!isNaN(d.getTime())) {
          now = d;
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  return now;
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  const [probabilities, setProbabilities] = useState<Map<string, any>>(
    new Map(),
  );

  // Unified simulation data
  const [predictions, setPredictionsState] = useState<PredictionResult[]>([]);
  const [matchupResults, setMatchupResults] = useState<MatchupData[]>([]);
  const [simulationIterations, setSimulationIterations] = useState(10000);
  const [simulationTime, setSimulationTime] = useState(0);
  const [simulationScoresHash, setSimulationScoresHash] = useState<string>("");

  // Compatibility aliases
  const predictionIterations = simulationIterations;
  const predictionTime = simulationTime;

  // Load simulation data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPredictions = localStorage.getItem("tournament_predictions");
        const savedMatchups = localStorage.getItem("tournament_matchups");
        const savedProbabilities = localStorage.getItem("tournament_knockout_probabilities");
        const savedIterations = localStorage.getItem("tournament_simulation_iterations");
        const savedTime = localStorage.getItem("tournament_simulation_time");
        const savedHash = localStorage.getItem("tournament_simulation_scores_hash");

        if (savedPredictions) {
          setPredictionsState(JSON.parse(savedPredictions));
        }
        if (savedMatchups) {
          setMatchupResults(JSON.parse(savedMatchups));
        }
        if (savedProbabilities) {
          setProbabilities(new Map(Object.entries(JSON.parse(savedProbabilities))));
        }
        if (savedIterations) {
          setSimulationIterations(Number(savedIterations));
        }
        if (savedTime) {
          setSimulationTime(Number(savedTime));
        }
        if (savedHash) {
          setSimulationScoresHash(savedHash);
        }
      } catch (err) {
        console.error("Failed to load simulation from localStorage:", err);
      }
    }
  }, []);

  const setSimulationResults = (
    preds: PredictionResult[],
    matchups: MatchupData[],
    knockoutProbabilities: Record<string, any>,
    iterations: number,
    time: number
  ) => {
    setPredictionsState(preds);
    setMatchupResults(matchups);
    setSimulationIterations(iterations);
    setSimulationTime(time);

    // Also save knockoutProbabilities as a Map in the context state
    setProbabilities(new Map(Object.entries(knockoutProbabilities)));

    const hash = getTournamentScoresHash(groups, knockoutMatches);
    setSimulationScoresHash(hash);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tournament_predictions", JSON.stringify(preds));
        localStorage.setItem("tournament_matchups", JSON.stringify(matchups));
        localStorage.setItem("tournament_knockout_probabilities", JSON.stringify(knockoutProbabilities));
        localStorage.setItem("tournament_simulation_iterations", String(iterations));
        localStorage.setItem("tournament_simulation_time", String(time));
        localStorage.setItem("tournament_simulation_scores_hash", hash);
      } catch (err) {
        console.error("Failed to save simulation to localStorage:", err);
      }
    }
  };

  const clearSimulationResults = () => {
    setPredictionsState([]);
    setMatchupResults([]);
    setProbabilities(new Map());
    setSimulationTime(0);
    setSimulationScoresHash("");

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("tournament_predictions");
        localStorage.removeItem("tournament_matchups");
        localStorage.removeItem("tournament_knockout_probabilities");
        localStorage.removeItem("tournament_simulation_iterations");
        localStorage.removeItem("tournament_simulation_time");
        localStorage.removeItem("tournament_simulation_scores_hash");
      } catch (err) {
        console.error("Failed to clear simulation from localStorage:", err);
      }
    }
  };

  const isSimulationStale = useMemo(() => {
    if (predictions.length === 0) return false;
    const currentHash = getTournamentScoresHash(groups, knockoutMatches);
    return currentHash !== simulationScoresHash;
  }, [groups, knockoutMatches, predictions, simulationScoresHash]);

  // Compatibility aliases implementation
  const setPredictions = (results: PredictionResult[], iterations: number, time: number) => {
    setSimulationResults(results, matchupResults, {}, iterations, time);
  };

  const clearPredictions = () => {
    clearSimulationResults();
  };

  // Fetch live rankings
  useEffect(() => {
    const loadRankings = async () => {
      const rankings = await fetchFifaRankings();
      if (rankings.size > 0) {
        setGroups((currentGroups) => {
          return currentGroups.map((group) => ({
            ...group,
            teams: group.teams.map((team) => {
              const data = getRankingDataForTeam(team.name, rankings);
              return data
                ? { ...team, ranking: data.rank, fifaPoints: data.points }
                : team;
            }),
          }));
        });
      }
    };
    loadRankings();
  }, []);

  // Initialize/Update R32 matches when groups change
  useEffect(() => {
    const r32 = generateR32Matches(groups);

    setKnockoutMatches((prev) => {
      // Ensure we always have the base structure for all knockout stages
      const initialMatches = getInitialKnockoutMatches();
      
      // Merge previous matches with initial structure if missing
      const currentMatches = prev.length > 0 ? prev : initialMatches;
      
      // Safety check: if currentMatches is missing non-R32 matches, add them
      const hasR16 = currentMatches.some(m => m.stage === "R16");
      const baseMatches = hasR16 ? currentMatches : [...currentMatches, ...initialMatches];

      const getTeamIdentifier = (team: any) => {
        if (!team) return "";
        return "placeholder" in team ? team.placeholder : team.id;
      };

      // Update R32 matches
      // We need to preserve scores if the teams haven't changed
      const updatedR32 = r32.map((newMatch) => {
        const existing = prev.find((m) => m.id === newMatch.id);

        // Check if teams changed
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

        // If teams changed, reset score
        return {
          ...newMatch,
          stage: "R32",
          homeScore: null,
          awayScore: null,
          winner: null,
        } as KnockoutMatch;
      });

      // Filter out old R32s and add new ones
      const nonR32 = baseMatches
        .filter((m) => m.stage !== "R32")
        .map((m) => {
          const allDefs = [
            ...R16_MATCHES,
            ...QF_MATCHES,
            ...SF_MATCHES,
            ...FINAL_MATCHES,
          ];
          const def = allDefs.find((d) => d.id === m.id);
          if (def) {
            return {
              ...m,
              utcDate: (def as any).utcDate,
              location: (def as any).location,
            };
          }
          return m;
        });

      const combined = [...updatedR32, ...nonR32];
      return propagateKnockoutTeams(combined);
    });
  }, [groups]);

  // Probability Calculation Effect
  useEffect(() => {
    const runProbabilityCalc = async () => {
      // If we already have a valid, non-stale simulation, do not overwrite with quick calc
      const currentHash = getTournamentScoresHash(groups, knockoutMatches);
      const savedHash = localStorage.getItem("tournament_simulation_scores_hash");
      if (currentHash === savedHash && localStorage.getItem("tournament_knockout_probabilities")) {
        try {
          const savedProbs = localStorage.getItem("tournament_knockout_probabilities");
          if (savedProbs) {
            setProbabilities(new Map(Object.entries(JSON.parse(savedProbs))));
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved knockout probabilities:", e);
        }
      }

      // Import dynamically to avoid circular dependencies if any, though imports are top-level
      const { calculateKnockoutProbabilities } =
        await import("@/utils/probabilityUtils");

      // We run probability calculation if there are matches
      // The util handles skipping simulation for finished matches, effectively giving 100% prob
      if (groups.length > 0) {
        const newProbabilities = await calculateKnockoutProbabilities(
          groups,
          knockoutMatches,
        );
        setProbabilities(newProbabilities);
      }
    };

    const timer = setTimeout(runProbabilityCalc, 500);
    return () => clearTimeout(timer);
  }, [groups, knockoutMatches, simulationScoresHash]);

  const updateMatch = useCallback((
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
    homeScorers?: Scorer[],
    awayScorers?: Scorer[],
  ) => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        if (group.name !== groupId) return group;

        // Update match in the group
        const updatedMatches = group.matches.map((match) => {
          if (match.id !== matchId) return match;
          return {
            ...match,
            homeScore: homeScore,
            awayScore: awayScore,
            homeScorers: homeScorers || match.homeScorers,
            awayScorers: awayScorers || match.awayScorers,
            finished: finished !== undefined ? finished : (homeScore !== null && awayScore !== null),
            status: status || match.status,
            elapsed: elapsed !== undefined ? elapsed : match.elapsed,
            lastSyncAt: new Date().toISOString(),
          };
        });

        const updatedGroup = { ...group, matches: updatedMatches };
        return recalculateGroupStats(updatedGroup);
      });
    });
  }, []);

  const updateKnockoutMatch = useCallback((
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties: number | null = null,
    awayPenalties: number | null = null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
    homeScorers?: Scorer[],
    awayScorers?: Scorer[],
  ) => {
    setKnockoutMatches((currentMatches) => {
      const newMatches = currentMatches.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          homeScore: homeScore,
          awayScore: awayScore,
          homePenalties: homePenalties,
          awayPenalties: awayPenalties,
          homeScorers: homeScorers || m.homeScorers,
          awayScorers: awayScorers || m.awayScorers,
          finished: finished !== undefined ? finished : (homeScore !== null && awayScore !== null),
          status: status || m.status,
          elapsed: elapsed !== undefined ? elapsed : m.elapsed,
          lastSyncAt: new Date().toISOString(),
        };
      });

      return propagateKnockoutTeams(newMatches);
    });
  }, []);

  const simulateGroups = () => {
    const now = getEffectiveNow();
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        const updatedMatches = group.matches.map((match) => {
          const isStartedOrFinished = now >= new Date(match.utcDate);
          if (isStartedOrFinished) {
            return match;
          }

          const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
          const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);

          const { home, away } = predictMatchScore(homeTeam, awayTeam);

          return {
            ...match,
            homeScore: home,
            awayScore: away,
            finished: true,
          };
        });

        return recalculateGroupStats({ ...group, matches: updatedMatches });
      });
    });
  };

  const simulateKnockout = () => {
    const now = getEffectiveNow();
    setKnockoutMatches((currentMatches) => {
      const resetMatches = currentMatches.map((m) => {
        const isStartedOrFinished = now >= new Date(m.utcDate);
        if (isStartedOrFinished) {
          return m;
        }
        return {
          ...m,
          homeScore: null,
          awayScore: null,
          homePenalties: null,
          awayPenalties: null,
          winner: null,
          finished: false,
        };
      });
      return runKnockoutSimulation(resetMatches);
    });
  };

  const simulateAll = () => {
    const now = getEffectiveNow();
    const resetGroups = groups.map((group) => ({
      ...group,
      matches: group.matches.map((match) => {
        const isStartedOrFinished = now >= new Date(match.utcDate);
        if (isStartedOrFinished) {
          return match;
        }
        return {
          ...match,
          homeScore: null,
          awayScore: null,
          finished: false,
        };
      }),
    }));

    const preservedKnockouts = knockoutMatches.filter((match) => {
      return now >= new Date(match.utcDate);
    });

    const result = simulateTournament(resetGroups, preservedKnockouts);
    setGroups(result.groups);
    setKnockoutMatches(result.knockoutMatches);
  };

  const resetTournament = () => {
    const now = getEffectiveNow();

    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        // Reset only matches that haven't started or finished
        const resetMatches = group.matches.map((match) => {
          const isStartedOrFinished = now >= new Date(match.utcDate);
          if (isStartedOrFinished) {
            return match;
          }
          return {
            ...match,
            homeScore: null,
            awayScore: null,
            finished: false,
          };
        });
        // Recalculate stats
        return recalculateGroupStats({ ...group, matches: resetMatches });
      });
    });

    setKnockoutMatches((currentMatches) => {
      return currentMatches.map((match) => {
        const isStartedOrFinished = now >= new Date(match.utcDate);
        if (isStartedOrFinished) {
          return match;
        }
        return {
          ...match,
          homeScore: null,
          awayScore: null,
          homePenalties: null,
          awayPenalties: null,
          winner: null,
          finished: false,
        };
      });
    });
  };

  const exposedKnockoutMatches = useMemo(() => {
    return knockoutMatches.map((m) => {
      const prob = probabilities.get(m.id);
      if (prob) {
        return { ...m, probabilisticData: prob };
      }
      return m;
    });
  }, [knockoutMatches, probabilities]);

  return (
    <TournamentContext.Provider
      value={{
        groups,
        knockoutMatches: exposedKnockoutMatches,
        updateMatch,
        updateKnockoutMatch,
        simulateGroups,
        simulateKnockout,
        simulateAll,
        resetTournament,
        predictions,
        matchupResults,
        simulationIterations,
        simulationTime,
        setSimulationResults,
        clearSimulationResults,
        isSimulationStale,
        
        // Compatibility aliases
        predictionIterations,
        predictionTime,
        setPredictions,
        clearPredictions,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}
