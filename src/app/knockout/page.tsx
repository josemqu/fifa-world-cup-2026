"use client";

import { KnockoutStage } from "@/components/KnockoutStage";
import { useTournament } from "@/context/TournamentContext";

export default function KnockoutPage() {
  const { groups } = useTournament();

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">
      <KnockoutStage groups={groups} />
    </div>
  );
}
