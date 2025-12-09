"use client";

import { GroupStage } from "@/components/GroupStage";
import { useTournament } from "@/context/TournamentContext";
import { PageTransition } from "@/components/PageTransition";

export default function GroupsPage() {
  const { groups, updateMatch } = useTournament();

  return (
    <PageTransition className="max-w-[1600px] mx-auto p-4 md:p-4">
      <GroupStage groups={groups} onMatchUpdate={updateMatch} />
    </PageTransition>
  );
}
