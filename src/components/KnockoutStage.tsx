import { Group } from "@/data/types";
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
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm min-w-[200px] relative z-10">
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

// Helper to render a pair of matches with a connector
function MatchPair({
  match1,
  match2,
  roundName,
}: {
  match1: any;
  match2: any;
  roundName: string;
}) {
  return (
    <div className="flex flex-col justify-around h-full relative">
      <MatchCard match={match1} roundName={roundName} />
      <MatchCard match={match2} roundName={roundName} />

      {/* Connector Bracket */}
      <div className="absolute right-0 top-1/4 bottom-1/4 w-8 translate-x-full pointer-events-none">
        {/* Vertical Line and Horizontal Arms */}
        <div className="absolute inset-0 border-r-2 border-y-2 border-slate-300 dark:border-slate-600 rounded-r-xl" />
        {/* Horizontal Tail to next round */}
        <div className="absolute top-1/2 right-0 w-4 h-[2px] bg-slate-300 dark:bg-slate-600 translate-x-full transform -translate-y-1/2" />
      </div>
    </div>
  );
}

export function KnockoutStage({ groups }: KnockoutStageProps) {
  const r32Matches = generateR32Matches(groups);
  const { thirdPlaceTeams } = getGroupStandings(groups);
  const sortedThirds = getSortedThirdPlaceTeams(thirdPlaceTeams);

  // Helper to chunk matches into pairs
  const pairMatches = (matches: any[]) => {
    const pairs = [];
    for (let i = 0; i < matches.length; i += 2) {
      pairs.push({ m1: matches[i], m2: matches[i + 1] });
    }
    return pairs;
  };

  const r32Pairs = pairMatches(r32Matches);
  const r16Pairs = pairMatches(
    R16_MATCHES.map((m) => ({
      ...m,
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
    }))
  );
  const qfPairs = pairMatches(
    QF_MATCHES.map((m) => ({
      ...m,
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
    }))
  );
  const sfPairs = pairMatches(
    SF_MATCHES.map((m) => ({
      ...m,
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
    }))
  );

  const finalMatch = FINAL_MATCHES.find((m) => m.id === "104");
  const thirdPlaceMatch = FINAL_MATCHES.find((m) => m.id === "103");

  const headerClass =
    "text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 py-3 px-4 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg backdrop-blur-sm text-center bg-slate-50/95 dark:bg-slate-900/95";

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="overflow-x-auto py-4">
        <div
          className="grid gap-x-12 gap-y-4 min-w-max px-4"
          style={{
            gridTemplateColumns: "repeat(5, minmax(240px, 1fr))",
            gridTemplateRows: "auto repeat(8, minmax(220px, auto))",
          }}
        >
          {/* Headers */}
          <div className="col-start-1">
            <h3 className={headerClass}>16avos de Final</h3>
          </div>
          <div className="col-start-2">
            <h3 className={headerClass}>Octavos de Final</h3>
          </div>
          <div className="col-start-3">
            <h3 className={headerClass}>Cuartos de Final</h3>
          </div>
          <div className="col-start-4">
            <h3 className={headerClass}>Semifinales</h3>
          </div>
          <div className="col-start-5">
            <h3 className={headerClass}>Finales</h3>
          </div>

          {/* Round of 32 */}
          {r32Pairs.map((pair, i) => (
            <div
              key={`r32-${i}`}
              className="col-start-1"
              style={{ gridRow: i + 2 }}
            >
              <MatchPair match1={pair.m1} match2={pair.m2} roundName="R32" />
            </div>
          ))}

          {/* Round of 16 */}
          {r16Pairs.map((pair, i) => (
            <div
              key={`r16-${i}`}
              className="col-start-2"
              style={{ gridRow: `${i * 2 + 2} / span 2` }}
            >
              <MatchPair match1={pair.m1} match2={pair.m2} roundName="R16" />
            </div>
          ))}

          {/* Quarter Finals */}
          {qfPairs.map((pair, i) => (
            <div
              key={`qf-${i}`}
              className="col-start-3"
              style={{ gridRow: `${i * 4 + 2} / span 4` }}
            >
              <MatchPair match1={pair.m1} match2={pair.m2} roundName="QF" />
            </div>
          ))}

          {/* Semi Finals */}
          {sfPairs.map((pair, i) => (
            <div
              key={`sf-${i}`}
              className="col-start-4"
              style={{ gridRow: `${i * 8 + 2} / span 8` }}
            >
              <MatchPair match1={pair.m1} match2={pair.m2} roundName="SF" />
            </div>
          ))}

          {/* Finals & 3rd Place */}
          <div
            className="col-start-5 relative"
            style={{ gridRow: "2 / span 8" }}
          >
            {/* Final Match - Centered */}
            {finalMatch && (
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10">
                <h4 className="text-sm font-semibold text-center mb-2 text-slate-500">
                  {finalMatch.label}
                </h4>
                <MatchCard
                  match={{
                    ...finalMatch,
                    homeTeam: {
                      placeholder: finalMatch.home.startsWith("W")
                        ? `W${finalMatch.home.replace("W", "")}`
                        : `L${finalMatch.home.replace("L", "")}`,
                    },
                    awayTeam: {
                      placeholder: finalMatch.away.startsWith("W")
                        ? `W${finalMatch.away.replace("W", "")}`
                        : `L${finalMatch.away.replace("L", "")}`,
                    },
                  }}
                  roundName="Final"
                />
                {/* Incoming Line Connector */}
                <div className="absolute top-1/2 left-0 w-4 h-[2px] bg-slate-300 dark:bg-slate-600 transform -translate-y-1/2 -translate-x-full" />
              </div>
            )}

            {/* 3rd Place Match - Bottom */}
            {thirdPlaceMatch && (
              <div className="absolute top-1/2 left-0 right-0 mt-32 z-10">
                <h4 className="text-sm font-semibold text-center mb-2 text-slate-500">
                  {thirdPlaceMatch.label}
                </h4>
                <MatchCard
                  match={{
                    ...thirdPlaceMatch,
                    homeTeam: {
                      placeholder: thirdPlaceMatch.home.startsWith("W")
                        ? `W${thirdPlaceMatch.home.replace("W", "")}`
                        : `L${thirdPlaceMatch.home.replace("L", "")}`,
                    },
                    awayTeam: {
                      placeholder: thirdPlaceMatch.away.startsWith("W")
                        ? `W${thirdPlaceMatch.away.replace("W", "")}`
                        : `L${thirdPlaceMatch.away.replace("L", "")}`,
                    },
                  }}
                  roundName="Final"
                />
              </div>
            )}
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
