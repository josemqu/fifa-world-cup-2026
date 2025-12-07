import { Group, Team } from "@/data/types";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { getTeamAbbreviation } from "@/utils/teamAbbreviations";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  // Sort teams by points, then GD, then GF (simplified logic for now)
  const sortedTeams = [...group.teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
    return b.gf - a.gf;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
          Grupo {group.name}
        </h3>
      </div>

      <div className="overflow-x-auto">
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
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 relative h-14">
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
                  <span title={team.name} className="cursor-help">
                    {getTeamAbbreviation(team.name)}
                  </span>
                </td>
                <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                  {team.played}
                </td>
                <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                  {team.won}
                </td>
                <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                  {team.drawn}
                </td>
                <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                  {team.lost}
                </td>
                <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                  {team.gf}
                </td>
                <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                  {team.ga}
                </td>
                <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                  {team.gf - team.ga > 0
                    ? `+${team.gf - team.ga}`
                    : team.gf - team.ga}
                </td>
                <td className="px-2 py-3 text-center font-bold text-slate-800 dark:text-slate-100">
                  {team.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
