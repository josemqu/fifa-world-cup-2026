import { useState } from "react";
import { GroupCard } from "./GroupCard";
import { Group } from "@/data/types";
import { Eye, EyeOff } from "lucide-react";
import { useTournament } from "@/context/TournamentContext";

interface GroupStageProps {
  groups: Group[];
  onMatchUpdate: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null
  ) => void;
}

export function GroupStage({ groups, onMatchUpdate }: GroupStageProps) {
  const { simulateGroups } = useTournament();
  // Store which groups have their matches HIDDEN.
  // We initialize with all groups hidden by default as requested.
  const [hiddenGroups, setHiddenGroups] = useState<Record<string, boolean>>(
    () => {
      const initialHidden: Record<string, boolean> = {};
      groups.forEach((g) => {
        initialHidden[g.name] = true;
      });
      return initialHidden;
    }
  );

  const allHidden = groups.every((g) => hiddenGroups[g.name]);

  const toggleAll = () => {
    if (allHidden) {
      // Show all -> clear hidden map
      setHiddenGroups({});
    } else {
      // Hide all -> set all to true
      const newHidden: Record<string, boolean> = {};
      groups.forEach((g) => {
        newHidden[g.name] = true;
      });
      setHiddenGroups(newHidden);
    }
  };

  const toggleGroup = (groupName: string) => {
    setHiddenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((group) => (
          <GroupCard
            key={group.name}
            group={group}
            onMatchUpdate={onMatchUpdate}
            showMatches={!hiddenGroups[group.name]}
            onToggleMatches={() => toggleGroup(group.name)}
          />
        ))}
      </div>

      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3 items-end">
        <button
          onClick={toggleAll}
          className="bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm px-4 py-2 rounded-full font-medium transition-all shadow-xl flex items-center gap-2 hover:scale-105 hover:shadow-2xl"
          title={
            allHidden
              ? "Mostrar todos los partidos"
              : "Ocultar todos los partidos"
          }
        >
          {allHidden ? <Eye size={18} /> : <EyeOff size={18} />}
          <span>{allHidden ? "Mostrar partidos" : "Ocultar partidos"}</span>
        </button>

        <button
          onClick={simulateGroups}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-full font-medium transition-colors shadow-xl flex items-center gap-2 hover:scale-105 transform duration-200"
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
        </button>
      </div>
    </div>
  );
}
