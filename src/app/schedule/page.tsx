"use client";

import { Suspense } from "react";
import { DailySchedule } from "@/components/DailySchedule";
import { useTournament } from "@/context/TournamentContext";
import { PageTransition } from "@/components/PageTransition";

export default function SchedulePage() {
  const { groups, knockoutMatches } = useTournament();

  return (
    <PageTransition className="max-w-4xl mx-auto p-4 md:p-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <DailySchedule groups={groups} knockoutMatches={knockoutMatches} />
      </Suspense>
    </PageTransition>
  );
}
