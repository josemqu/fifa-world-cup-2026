import { useState } from "react";
import { GroupCard } from "./GroupCard";
import { Group } from "@/data/types";
import { Eye, EyeOff } from "lucide-react";

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
  // Store which groups have their matches HIDDEN.
  // Using "hidden" logic means default (undefined/false) is visible.
  const [hiddenGroups, setHiddenGroups] = useState<Record<string, boolean>>({});

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
      <div className="flex justify-end">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
          title={
            allHidden
              ? "Mostrar todos los partidos"
              : "Ocultar todos los partidos"
          }
        >
          {allHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{allHidden ? "Mostrar partidos" : "Ocultar partidos"}</span>
        </button>
      </div>

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

      <div className="flex justify-end">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
          title={
            allHidden
              ? "Mostrar todos los partidos"
              : "Ocultar todos los partidos"
          }
        >
          {allHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{allHidden ? "Mostrar partidos" : "Ocultar partidos"}</span>
        </button>
      </div>
    </div>
  );
}
