import { GroupCard } from "./GroupCard";
import { Group } from "@/data/types";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
      {groups.map((group) => (
        <GroupCard
          key={group.name}
          group={group}
          onMatchUpdate={onMatchUpdate}
        />
      ))}
    </div>
  );
}
