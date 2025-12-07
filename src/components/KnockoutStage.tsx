import { Group, Team } from "@/data/types";
import {
  generateR32Matches,
  getGroupStandings,
  getSortedThirdPlaceTeams,
} from "@/utils/knockoutUtils";
import {
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";
import { clsx } from "clsx";

interface KnockoutStageProps {
  groups: Group[];
}

// Helper to render a match card
function MatchCard({ match, roundName }: { match: any; roundName: string }) {
  const homeName =
    "placeholder" in match.homeTeam
      ? match.homeTeam.placeholder
      : match.homeTeam.name;
  const awayName =
    "placeholder" in match.awayTeam
      ? match.awayTeam.placeholder
      : match.awayTeam.name;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm min-w-[200px] mb-4">
      <div className="text-xs text-slate-400 mb-2 flex justify-between">
        <span>Match {match.id}</span>
        {match.next && <span>To: G{match.next}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span
            className={clsx(
              "font-medium text-sm",
              "placeholder" in match.homeTeam
                ? "text-slate-400 italic"
                : "text-slate-900 dark:text-slate-100"
            )}
          >
            {homeName}
          </span>
          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">
            -
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span
            className={clsx(
              "font-medium text-sm",
              "placeholder" in match.awayTeam
                ? "text-slate-400 italic"
                : "text-slate-900 dark:text-slate-100"
            )}
          >
            {awayName}
          </span>
          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">
            -
          </span>
        </div>
      </div>
    </div>
  );
}

export function KnockoutStage({ groups }: KnockoutStageProps) {
  const r32Matches = generateR32Matches(groups);
  const { thirdPlaceTeams } = getGroupStandings(groups);
  const sortedThirds = getSortedThirdPlaceTeams(thirdPlaceTeams);

  // For subsequent rounds, we would need to determine winners.
  // For now, I'll just render the structure with placeholders "Winner GXX"

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="overflow-x-auto">
        <div className="flex gap-8 min-w-max px-4">
          {/* Round of 32 */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">
              Round of 32
            </h3>
            <div className="flex flex-col gap-4">
              {r32Matches.map((m) => (
                <MatchCard key={m.id} match={m} roundName="R32" />
              ))}
            </div>
          </div>

          {/* Round of 16 */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">
              Round of 16
            </h3>
            <div className="flex flex-col gap-4 justify-around h-full">
              {R16_MATCHES.map((m) => (
                <MatchCard
                  key={m.id}
                  match={{
                    ...m,
                    homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
                    awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
                  }}
                  roundName="R16"
                />
              ))}
            </div>
          </div>

          {/* Quarter Finals */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">
              Quarter Finals
            </h3>
            <div className="flex flex-col gap-4 justify-around h-full">
              {QF_MATCHES.map((m) => (
                <MatchCard
                  key={m.id}
                  match={{
                    ...m,
                    homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
                    awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
                  }}
                  roundName="QF"
                />
              ))}
            </div>
          </div>

          {/* Semi Finals */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">
              Semi Finals
            </h3>
            <div className="flex flex-col gap-4 justify-around h-full">
              {SF_MATCHES.map((m) => (
                <MatchCard
                  key={m.id}
                  match={{
                    ...m,
                    homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
                    awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
                  }}
                  roundName="SF"
                />
              ))}
            </div>
          </div>

          {/* Final & 3rd Place */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">
              Finals
            </h3>
            <div className="flex flex-col gap-4 justify-center h-full">
              {FINAL_MATCHES.map((m) => (
                <div key={m.id} className="mb-8">
                  <h4 className="text-sm font-semibold text-center mb-2 text-slate-500">
                    {m.label}
                  </h4>
                  <MatchCard
                    match={{
                      ...m,
                      homeTeam: {
                        placeholder: m.home.startsWith("W")
                          ? `W${m.home.replace("W", "")}`
                          : `L${m.home.replace("L", "")}`,
                      },
                      awayTeam: {
                        placeholder: m.away.startsWith("W")
                          ? `W${m.away.replace("W", "")}`
                          : `L${m.away.replace("L", "")}`,
                      },
                    }}
                    roundName="Final"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Third Place Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-4xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">
            Mejores Terceros
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Los 8 mejores clasifican a 16avos de final
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Grp</th>
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="px-4 py-3 font-medium text-center">Pts</th>
                <th className="px-4 py-3 font-medium text-center">Dif</th>
                <th className="px-4 py-3 font-medium text-center">GF</th>
                <th className="px-4 py-3 font-medium text-center">PG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedThirds.map((team, index) => {
                const isQualified = index < 8;
                return (
                  <tr
                    key={team.id}
                    className={clsx(
                      "transition-colors",
                      isQualified
                        ? "bg-green-50/50 dark:bg-green-900/10"
                        : "opacity-60"
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                      {team.group}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {team.code && (
                          <span className="font-mono text-xs text-slate-400 w-8">
                            {team.code}
                          </span>
                        )}
                        {team.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {team.pts}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {team.gf - team.ga > 0 ? "+" : ""}
                      {team.gf - team.ga}
                    </td>
                    <td className="px-4 py-3 text-center">{team.gf}</td>
                    <td className="px-4 py-3 text-center">{team.won}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
