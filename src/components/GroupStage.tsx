import { useState, useMemo, useEffect } from "react";
import { GroupCard } from "./GroupCard";
import { Group } from "@/data/types";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useTournament } from "@/context/TournamentContext";
import {
  FloatingContainer,
  FloatingButton,
} from "@/components/ui/FloatingActions";
import {
  getGroupStandings,
  getSortedThirdPlaceTeams,
} from "@/utils/knockoutUtils";
import { ThirdPlaceTable } from "@/components/ThirdPlaceTable";
import { estimateBestThirdQualificationProbabilities } from "@/utils/thirdPlaceMonteCarlo";
import {
  estimateGroupPositionProbabilities,
  AllGroupPositionProbs,
} from "@/utils/groupPositionMonteCarlo";
import { analyzeQualifiedThirds } from "@/utils/groupAnalysis";

interface GroupStageProps {
  groups: Group[];
  onMatchUpdate: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
  ) => void;
}

export function GroupStage({ groups, onMatchUpdate }: GroupStageProps) {
  const { simulateGroups, resetTournament } = useTournament();

  const [thirdQualificationProbabilities, setThirdQualificationProbabilities] =
    useState<Map<string, number> | null>(null);

  const [groupPositionProbs, setGroupPositionProbs] =
    useState<AllGroupPositionProbs | null>(null);

  const [qualifiedThirdIds, setQualifiedThirdIds] = useState<Set<string>>(
    new Set()
  );

  const [showProbabilitiesIcon, setShowProbabilitiesIcon] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("showProbabilitiesIcon");
      if (stored !== null) {
        setShowProbabilitiesIcon(stored === "true");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("showProbabilitiesIcon", String(showProbabilitiesIcon));
  }, [showProbabilitiesIcon]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "p" || e.key === "P") {
        setShowProbabilitiesIcon((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { sortedThirds, isGroupStageComplete } =
    useMemo(() => {
      const { thirdPlaceTeams } = getGroupStandings(groups);
      const sorted = getSortedThirdPlaceTeams(thirdPlaceTeams);
      const stageComplete = groups.every((g) =>
        g.matches.every((m) => m.homeScore != null && m.awayScore != null)
      );
      return {
        sortedThirds: sorted,
        isGroupStageComplete: stageComplete,
      };
    }, [groups]);

  useEffect(() => {
    // Monte Carlo estimations — defer to avoid blocking render.
    setThirdQualificationProbabilities(null);
    setGroupPositionProbs(null);
    const t = setTimeout(() => {
      setThirdQualificationProbabilities(
        estimateBestThirdQualificationProbabilities(groups, 1200)
      );
      setGroupPositionProbs(
        estimateGroupPositionProbabilities(groups, 1200)
      );
      // Monte Carlo counterexample-based third-place qualification:
      // A third is "qualified" only if it finishes in the top 8 thirds
      // in ALL simulations (no counterexample found).
      setQualifiedThirdIds(analyzeQualifiedThirds(groups, 1000));
    }, 0);
    return () => clearTimeout(t);
  }, [groups]);

  // Store which groups have their matches HIDDEN.
  const [hiddenGroups, setHiddenGroups] = useState<Map<string, boolean>>(() => {
    return new Map(groups.map((g) => [g.name, true]));
  });

  const allHidden = groups.every((g) => hiddenGroups.get(g.name));

  const toggleAll = () => {
    if (allHidden) {
      // Show all -> clear hidden map
      setHiddenGroups(new Map());
    } else {
      // Hide all -> set all to true
      setHiddenGroups(new Map(groups.map((g) => [g.name, true])));
    }
  };

  const toggleGroup = (groupName: string) => {
    setHiddenGroups((prev) => {
      const next = new Map(prev);
      next.set(groupName, !prev.get(groupName));
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((group) => (
          <GroupCard
            key={group.name}
            group={group}
            onMatchUpdate={onMatchUpdate}
            showMatches={!hiddenGroups.get(group.name)}
            onToggleMatches={() => toggleGroup(group.name)}
            qualifiedThirdIds={qualifiedThirdIds}
            positionProbabilities={groupPositionProbs?.get(group.name) ?? undefined}
            showPositionProbabilitiesIcon={showProbabilitiesIcon}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <ThirdPlaceTable
          teams={sortedThirds}
          showQualification={isGroupStageComplete}
          qualificationProbabilities={
            thirdQualificationProbabilities ?? undefined
          }
          monteCarloQualifiedIds={qualifiedThirdIds}
        />
      </div>

      <FloatingContainer>
        <FloatingButton
          onClick={toggleAll}
          className="bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500"
          title={
            allHidden
              ? "Mostrar todos los partidos"
              : "Ocultar todos los partidos"
          }
        >
          {allHidden ? <Eye size={18} /> : <EyeOff size={18} />}
          <span>
            {allHidden ? "Mostrar los Partidos" : "Ocultar los Partidos"}
          </span>
        </FloatingButton>

        <FloatingButton
          onClick={simulateGroups}
          className="bg-blue-600 hover:bg-blue-700"
          title="Simular resultados de la Fase de Grupos"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.312-.312a7 7 0 00-11.712 3.139.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.312h-2.433a.75.75 0 000 1.5h4.242z"
              clipRule="evenodd"
            />
          </svg>
          Simular Grupos
        </FloatingButton>

        <FloatingButton
          onClick={resetTournament}
          className="bg-red-600 hover:bg-red-700"
          title="Limpiar todos los resultados"
        >
          <Trash2 size={18} />
          Limpiar
        </FloatingButton>
      </FloatingContainer>
    </div>
  );
}
