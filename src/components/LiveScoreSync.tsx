"use client";

import { useLiveScores } from "@/hooks/useLiveScores";

/**
 * Invisible component that activates live score polling.
 * Mount inside TournamentProvider to auto-sync scores during the tournament.
 *
 * Does NOT render anything — just runs the polling hook.
 */
export function LiveScoreSync() {
  useLiveScores(true);
  return null;
}
