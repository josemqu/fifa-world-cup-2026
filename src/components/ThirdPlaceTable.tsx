import { Team } from "@/data/types";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { Tooltip } from "@/components/ui/Tooltip";
import { getTeamAbbreviation } from "@/utils/teamAbbreviations";
import { clsx } from "clsx";
import { CheckCircle2 } from "lucide-react";

interface ThirdPlaceTableProps {
  teams: Team[];
  showQualification?: boolean;
  qualificationProbabilities?: Record<string, number>;
}

export function ThirdPlaceTable({
  teams,
  showQualification = false,
  qualificationProbabilities,
}: ThirdPlaceTableProps) {
  // We expect 'teams' to be already sorted by performance
  const top8 = teams.slice(0, 8);
  const qualifiedIds = new Set(top8.map((t) => t.id));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-fade-in-up">
      <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Mejores Terceros
          <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            Top 8 clasifican
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium w-8 text-center">
                #
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                Equipo
              </th>
              <th scope="col" className="px-2 py-2 text-center w-10">
                Grp
              </th>
              <th scope="col" className="px-2 py-2 text-center w-10">
                Pts
              </th>
              <th scope="col" className="px-2 py-2 text-center w-10">
                DG
              </th>
              <th scope="col" className="px-2 py-2 text-center w-10">
                GF
              </th>
              <th scope="col" className="px-2 py-2 text-center w-10">
                G
              </th>
              <th scope="col" className="px-2 py-2 text-center w-14">
                Prob.
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => {
              const isQualified =
                showQualification && qualifiedIds.has(team.id);
              const prob = qualificationProbabilities?.[team.id];
              return (
                <tr
                  key={team.id}
                  className={clsx(
                    "border-b border-slate-100 dark:border-slate-700/50 last:border-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                    isQualified ? "bg-green-50/30 dark:bg-green-900/10" : ""
                  )}
                >
                  <td className="px-3 py-2 text-center font-mono text-xs text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 relative">
                    {isQualified && (
                      <span className="absolute -left-1 w-1 h-4 bg-green-500 rounded-r-full" />
                    )}
                    <TeamFlag
                      teamName={team.name}
                      className="w-5 h-3.5 shadow-sm"
                    />
                    <Tooltip content={team.name} placement="right">
                      <span className="cursor-help">
                        {getTeamAbbreviation(team.name)}
                      </span>
                    </Tooltip>
                    {isQualified && (
                      <Tooltip content="Clasificado" placement="top">
                        <CheckCircle2
                          size={14}
                          className="text-green-600 dark:text-green-400 ml-1"
                        />
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-slate-500">
                    {team.group}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-slate-800 dark:text-slate-100">
                    {team.pts}
                  </td>
                  <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                    {team.gf - team.ga > 0
                      ? `+${team.gf - team.ga}`
                      : team.gf - team.ga}
                  </td>
                  <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                    {team.gf}
                  </td>
                  <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                    {team.won}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                    {showQualification
                      ? isQualified
                        ? "100%"
                        : "0%"
                      : prob != null
                      ? `${Math.round(prob * 100)}%`
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
