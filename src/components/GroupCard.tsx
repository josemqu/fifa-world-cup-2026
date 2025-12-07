import { Group, Team, Match } from "@/data/types";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/Tooltip";
import { getTeamAbbreviation } from "@/utils/teamAbbreviations";

interface GroupCardProps {
  group: Group;
  onMatchUpdate: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null
  ) => void;
}

export function GroupCard({ group, onMatchUpdate }: GroupCardProps) {
  // Sort teams by points, then GD, then GF (simplified logic for now)
  const sortedTeams = [...group.teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
    return b.gf - a.gf;
  });

  const getTeamName = (id: string) => {
    const team = group.teams.find((t) => t.id === id);
    return team ? team.name : id;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
    >
      <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
          Grupo {group.name}
        </h3>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Equipo
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8"
                title="Partidos Jugados"
              >
                PJ
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8"
                title="Ganados"
              >
                G
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8"
                title="Empatados"
              >
                E
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8"
                title="Perdidos"
              >
                P
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8"
                title="Goles a Favor"
              >
                GF
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8"
                title="Goles en Contra"
              >
                GC
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8"
                title="Diferencia de Goles"
              >
                DG
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-center w-8 font-bold text-slate-700 dark:text-slate-200"
                title="Puntos"
              >
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <tr
                key={team.id}
                className={clsx(
                  "border-b border-slate-100 dark:border-slate-700/50 last:border-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                  index < 2 ? "bg-green-50/30 dark:bg-green-900/10" : ""
                )}
              >
                <td className="px-4 py-1.5 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 relative h-9">
                  <span
                    className={clsx(
                      "w-1 h-full absolute left-0 top-0",
                      index < 2
                        ? "bg-green-500"
                        : index === 2
                        ? "bg-yellow-400/50"
                        : "bg-transparent"
                    )}
                  />
                  <Tooltip content={team.name}>
                    <span className="cursor-help">
                      {getTeamAbbreviation(team.name)}
                    </span>
                  </Tooltip>
                </td>
                <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                  {team.played}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                  {team.won}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                  {team.drawn}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                  {team.lost}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                  {team.gf}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                  {team.ga}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400 font-medium">
                  {team.gf - team.ga > 0
                    ? `+${team.gf - team.ga}`
                    : team.gf - team.ga}
                </td>
                <td className="px-2 py-1.5 text-center font-bold text-slate-800 dark:text-slate-100">
                  {team.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matches List */}
      <div className="bg-slate-50/30 dark:bg-slate-900/20 p-3">
        <h4 className="font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wider">
          Partidos
        </h4>
        <div className="space-y-1.5">
          {group.matches.map((match) => (
            <div
              key={match.id}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-800 shadow-sm"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wide leading-none">
                <span>{match.date}</span>
                {match.location && (
                  <span className="truncate max-w-[120px]">
                    {match.location}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <Tooltip content={getTeamName(match.homeTeamId)}>
                    <span className="font-bold text-slate-700 dark:text-slate-200 cursor-help">
                      {getTeamAbbreviation(getTeamName(match.homeTeamId))}
                    </span>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1.5 mx-2">
                  <input
                    type="number"
                    min="0"
                    className="w-7 h-7 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={match.homeScore ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newScore = val === "" ? null : parseInt(val);
                      onMatchUpdate(
                        group.name,
                        match.id,
                        newScore,
                        match.awayScore ?? null
                      );
                    }}
                    placeholder="-"
                  />
                  <span className="text-slate-400 dark:text-slate-600 font-bold text-[10px]">
                    :
                  </span>
                  <input
                    type="number"
                    min="0"
                    className="w-7 h-7 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={match.awayScore ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newScore = val === "" ? null : parseInt(val);
                      onMatchUpdate(
                        group.name,
                        match.id,
                        match.homeScore ?? null,
                        newScore
                      );
                    }}
                    placeholder="-"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-start">
                  <Tooltip content={getTeamName(match.awayTeamId)}>
                    <span className="font-bold text-slate-700 dark:text-slate-200 cursor-help">
                      {getTeamAbbreviation(getTeamName(match.awayTeamId))}
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
