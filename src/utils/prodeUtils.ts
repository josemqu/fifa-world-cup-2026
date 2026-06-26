export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  predHomePen?: number,
  predAwayPen?: number,
  actHomePen?: number,
  actAwayPen?: number
): number {
  // Determine actual winner
  let actualWinner: "home" | "away" | "tie" = "tie";
  if (actualHome > actualAway) {
    actualWinner = "home";
  } else if (actualAway > actualHome) {
    actualWinner = "away";
  } else if (actHomePen !== undefined && actAwayPen !== undefined && actHomePen !== null && actAwayPen !== null) {
    if (actHomePen > actAwayPen) {
      actualWinner = "home";
    } else if (actAwayPen > actHomePen) {
      actualWinner = "away";
    }
  }

  // Determine predicted winner
  let predictedWinner: "home" | "away" | "tie" = "tie";
  if (predictedHome > predictedAway) {
    predictedWinner = "home";
  } else if (predictedAway > predictedHome) {
    predictedWinner = "away";
  } else if (predHomePen !== undefined && predAwayPen !== undefined && predHomePen !== null && predAwayPen !== null) {
    if (predHomePen > predAwayPen) {
      predictedWinner = "home";
    } else if (predAwayPen > predHomePen) {
      predictedWinner = "away";
    }
  }

  // 1. Exact Score Match:
  // If it's a draw, both the normal score and the advancing team must match.
  // Otherwise, just the scores must match.
  const scoresMatch = predictedHome === actualHome && predictedAway === actualAway;
  if (scoresMatch) {
    if (actualHome === actualAway) {
      const hasActualPenalties = actHomePen !== undefined && actAwayPen !== undefined && actHomePen !== null && actAwayPen !== null;
      if (hasActualPenalties) {
        if (predictedWinner === actualWinner) {
          return 3;
        } else {
          // Got the draw score right (e.g. 1-1), but the wrong team advanced.
          // Award 1 point for predicting the correct draw score.
          return 1;
        }
      }
    }
    return 3;
  }

  // 2. Correct Outcome (not exact score):
  // Compare predicted winner vs actual winner (either normal time winner or penalty winner).
  if (actualWinner !== "tie" && predictedWinner === actualWinner) {
    return 1;
  }

  // If both actual and predicted are ties (no penalties or same tie outcome but wrong scores):
  const predictedOutcome = Math.sign(predictedHome - predictedAway);
  const actualOutcome = Math.sign(actualHome - actualAway);
  if (predictedOutcome === 0 && actualOutcome === 0) {
    return 1;
  }

  return 0;
}

import { INITIAL_GROUPS } from "@/data/initialData";
import {
  R32_MATCHES,
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";

export function hasMatchStarted(utcDateStr: string): boolean {
  return new Date() >= new Date(utcDateStr);
}

export function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function buildMatchDateMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const group of INITIAL_GROUPS) {
    for (const match of group.matches) {
      map[match.id] = match.utcDate;
    }
  }

  const knockoutArrays = [
    R32_MATCHES,
    R16_MATCHES,
    QF_MATCHES,
    SF_MATCHES,
    FINAL_MATCHES,
  ];
  for (const arr of knockoutArrays) {
    for (const match of arr) {
      if (match.utcDate) {
        map[match.id] = match.utcDate;
      }
    }
  }

  return map;
}

