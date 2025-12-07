import { INITIAL_GROUPS } from "@/data/initialData";
import { GroupCard } from "./GroupCard";

export function GroupStage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {INITIAL_GROUPS.map((group) => (
        <GroupCard key={group.name} group={group} />
      ))}
    </div>
  );
}
