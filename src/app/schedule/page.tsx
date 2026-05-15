"use client";

import { DailySchedule } from "@/components/DailySchedule";
import { useTournament } from "@/context/TournamentContext";
import { PageTransition } from "@/components/PageTransition";

export default function SchedulePage() {
  const { groups, knockoutMatches } = useTournament();

  return (
    <PageTransition className="max-w-4xl mx-auto p-4 md:p-6">
      <DailySchedule groups={groups} knockoutMatches={knockoutMatches} />
    </PageTransition>
  );
}
