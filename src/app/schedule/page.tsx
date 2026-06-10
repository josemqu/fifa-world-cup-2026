"use client";

import { Suspense } from "react";
import { DailySchedule } from "@/components/DailySchedule";
import { useTournament } from "@/context/TournamentContext";
import { PageTransition } from "@/components/PageTransition";
import { Calendar } from "lucide-react";

export default function SchedulePage() {
  const { groups, knockoutMatches } = useTournament();

  return (
    <PageTransition className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Cronograma del Mundial 2026
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            Seguí las fechas, horarios oficiales, sedes y estadios de todos los partidos del torneo en vivo.
          </p>
        </div>
      </div>

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
