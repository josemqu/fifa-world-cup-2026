"use client";

import { KnockoutStage } from "@/components/KnockoutStage";
import { useTournament } from "@/context/TournamentContext";

export default function KnockoutPage() {
  const { groups, knockoutMatches, updateKnockoutMatch } = useTournament();

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-4">
      <KnockoutStage
        groups={groups}
        matches={knockoutMatches}
        onMatchUpdate={updateKnockoutMatch}
      />
    </div>
  );
}
