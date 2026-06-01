import { Group, Team, Match } from "@/data/types";
import { clsx } from "clsx";
import { Tooltip } from "@/components/ui/Tooltip";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { getTeamAbbreviation } from "@/utils/teamAbbreviations";
import { ChevronDown, ChevronUp, CheckCircle2, Lock, Info } from "lucide-react";
import { analyzeGroup } from "@/utils/groupAnalysis";
import { useMemo } from "react";
import { MatchDateTime } from "@/components/ui/MatchDateTime";
import { FlashScoreInput } from "@/components/ui/FlashScoreInput";
import { GroupPositionProbMap } from "@/utils/groupPositionMonteCarlo";


interface GroupCardProps {
  group: Group;
  onMatchUpdate: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null
  ) => void;
  showMatches?: boolean;
  onToggleMatches?: () => void;
  qualifiedThirdIds?: Set<string>;
  positionProbabilities?: GroupPositionProbMap;
  showPositionProbabilitiesIcon?: boolean;
}

export function GroupCard({
  group,
  onMatchUpdate,
  showMatches = true,
  onToggleMatches,
  qualifiedThirdIds,
  positionProbabilities,
  showPositionProbabilitiesIcon = true,
}: GroupCardProps) {
  const sortedTeams = useMemo(() => {
    return [...group.teams].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
      if (b.gf !== a.gf) return b.gf - a.gf;
      return b.won - a.won;
    });
  }, [group.teams]);

  const analysis = useMemo(() => analyzeGroup(group), [group]);

  const getTeamName = (id: string) => {
    const team = group.teams.find((t) => t.id === id);
    return team ? team.name : id;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-fade-in-up">
      <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
          Grupo {group.name}
        </h3>
        <div className="flex items-center gap-1">
          {/* Position Probabilities Tooltip */}
          {showPositionProbabilitiesIcon && positionProbabilities && positionProbabilities.size > 0 && (
            <Tooltip
              placement="bottom"
              className="!text-left !max-w-none !w-auto"
              content={
                <div className="min-w-[280px] p-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                    Probabilidad por posición
                  </div>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700/50">
                        <th className="text-left pb-1 pr-3 font-medium">Equipo</th>
                        {sortedTeams.map((_, i) => (
                          <th key={i} className="text-center pb-1 px-1.5 font-medium min-w-[36px]">
                            {i + 1}º
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeams.map((team) => {
                        const probs = positionProbabilities.get(team.id);
                        return (
                          <tr key={team.id} className="border-b border-slate-700/20 last:border-none">
                            <td className="py-1 pr-3 text-white font-medium whitespace-nowrap">
                              {getTeamAbbreviation(team.name)}
                            </td>
                            {probs ? (
                              probs.map((p, i) => {
                                const pct = Math.round(p * 100);
                                return (
                                  <td
                                    key={i}
                                    className="text-center py-1 px-1.5 font-mono tabular-nums"
                                    style={{
                                      color:
                                        pct >= 70
                                          ? "#4ade80"
                                          : pct >= 40
                                          ? "#fbbf24"
                                          : pct >= 15
                                          ? "#fb923c"
                                          : "#94a3b8",
                                    }}
                                  >
                                    {pct}%
                                  </td>
                                );
                              })
                            ) : (
                              sortedTeams.map((_, i) => (
                                <td key={i} className="text-center py-1 px-1.5 text-slate-500">—</td>
                              ))
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Most Probable Ordering with Esperanza */}
                  {(() => {
                    // Calculate expected position for each team: E[pos] = Σ (pos+1) * P(pos)
                    const teamExpected = sortedTeams.map((team) => {
                      const probs = positionProbabilities.get(team.id);
                      if (!probs) return { team, expected: 2.5, confidence: 0, assignedPos: -1 };
                      const expected = probs.reduce((sum, p, i) => sum + (i + 1) * p, 0);
                      return { team, expected, confidence: 0, assignedPos: -1 };
                    });

                    // Sort by expected position (lowest = most likely 1st)
                    const ordered = [...teamExpected].sort((a, b) => a.expected - b.expected);

                    // Assign positions and get confidence (prob of that position)
                    ordered.forEach((entry, idx) => {
                      entry.assignedPos = idx;
                      const probs = positionProbabilities.get(entry.team.id);
                      entry.confidence = probs ? probs[idx] : 0;
                    });

                    // Overall certainty: geometric mean of individual confidences
                    const overallCertainty = ordered.length > 0
                      ? Math.round(
                          ordered.reduce((prod, e) => prod * e.confidence, 1) ** (1 / ordered.length) * 100
                        )
                      : 0;

                    return (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                            Orden más probable
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Certeza: <span className="text-white font-semibold">{overallCertainty}%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {ordered.map((entry) => {
                            const confPct = Math.round(entry.confidence * 100);
                            return (
                              <div key={entry.team.id} className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono w-4 shrink-0">
                                  {entry.assignedPos + 1}º
                                </span>
                                <span className="text-[11px] text-white font-medium w-10 shrink-0">
                                  {getTeamAbbreviation(entry.team.name)}
                                </span>
                                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden relative">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${confPct}%`,
                                      background:
                                        confPct >= 70
                                          ? "linear-gradient(90deg, #22c55e, #4ade80)"
                                          : confPct >= 40
                                          ? "linear-gradient(90deg, #eab308, #fbbf24)"
                                          : confPct >= 15
                                          ? "linear-gradient(90deg, #ea580c, #fb923c)"
                                          : "linear-gradient(90deg, #475569, #64748b)",
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-[10px] font-mono tabular-nums w-8 text-right shrink-0"
                                  style={{
                                    color:
                                      confPct >= 70
                                        ? "#4ade80"
                                        : confPct >= 40
                                        ? "#fbbf24"
                                        : confPct >= 15
                                        ? "#fb923c"
                                        : "#94a3b8",
                                  }}
                                >
                                  {confPct}%
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono w-10 text-right shrink-0" title="Esperanza (posición esperada)">
                                  E={entry.expected.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              }
            >
              <div className="p-1 cursor-help text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
                <Info size={16} />
              </div>
            </Tooltip>
          )}

          {onToggleMatches && (
            <button
              onClick={onToggleMatches}
              className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
              title={showMatches ? "Ocultar partidos" : "Mostrar partidos"}
            >
              {showMatches ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th scope="col" className="px-2 py-2 font-medium">
                Equipo
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7"
                title="Partidos Jugados"
              >
                PJ
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7"
                title="Ganados"
              >
                G
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7"
                title="Empatados"
              >
                E
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7"
                title="Perdidos"
              >
                P
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7"
                title="Goles a Favor"
              >
                GF
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7"
                title="Goles en Contra"
              >
                GC
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7"
                title="Diferencia de Goles"
              >
                DG
              </th>
              <th
                scope="col"
                className="px-1 py-2 text-center w-7 font-bold text-slate-700 dark:text-slate-200"
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
                  index < 2 || (index === 2 && qualifiedThirdIds?.has(team.id))
                    ? "bg-green-50/30 dark:bg-green-900/10"
                    : ""
                )}
              >
                <td className="px-2 py-1 pl-4 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 relative h-8">
                  <span
                    className={clsx(
                      "w-1 h-full absolute left-0 top-0",
                      index < 2
                        ? "bg-green-500"
                        : index === 2 && qualifiedThirdIds?.has(team.id)
                        ? "bg-green-500"
                        : index === 2
                        ? "bg-yellow-400/50"
                        : "bg-transparent"
                    )}
                  />
                  <div className="flex items-center min-w-0 flex-1">
                    <TeamFlag
                      teamName={team.name}
                      className="w-5 h-3.5 mr-2 shadow-sm shrink-0"
                    />
                    <Tooltip content={team.name} placement="right">
                      <span className="cursor-help mr-1 truncate">
                        {getTeamAbbreviation(team.name)}
                      </span>
                    </Tooltip>

                    {/* Qualification/Lock Indicators */}
                    <div className="flex gap-0.5 ml-1 shrink-0">
                      {analysis[team.id]?.isQualified && (
                        <Tooltip
                          content="Clasificado a la siguiente fase"
                          placement="top"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-green-600 dark:text-green-400"
                          />
                        </Tooltip>
                      )}
                      {/* Check for Qualified Best Third Place */}
                      {!analysis[team.id]?.isQualified &&
                        index === 2 &&
                        qualifiedThirdIds?.has(team.id) && (
                          <Tooltip
                            content="Clasificado como mejor tercero"
                            placement="top"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-green-600 dark:text-green-400"
                            />
                          </Tooltip>
                        )}

                      {analysis[team.id]?.isPositionLocked && (
                        <Tooltip
                          content={`Posición asegurada (${index + 1}º)`}
                          placement="top"
                        >
                          <Lock
                            size={14}
                            className="text-slate-400 dark:text-slate-500"
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                  {team.played}
                </td>
                <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                  {team.won}
                </td>
                <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                  {team.drawn}
                </td>
                <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                  {team.lost}
                </td>
                <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                  {team.gf}
                </td>
                <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400">
                  {team.ga}
                </td>
                <td className="px-1 py-1 text-center text-slate-600 dark:text-slate-400 font-medium">
                  {team.gf - team.ga > 0
                    ? `+${team.gf - team.ga}`
                    : team.gf - team.ga}
                </td>
                <td className="px-1 py-1 text-center font-bold text-slate-800 dark:text-slate-100">
                  {team.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matches List */}
      {showMatches && (
        <div className="overflow-hidden animate-fade-in-up">
          <div className="bg-slate-50/30 dark:bg-slate-900/20 p-2 border-t border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wider">
              Partidos
            </h4>
            <div className="space-y-1.5">
              {group.matches.map((match) => (
                <div
                  key={match.id}
                  className="text-xs border border-slate-200 dark:border-slate-700 rounded-md p-1.5 bg-white dark:bg-slate-800 shadow-sm"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide leading-none">
                    <MatchDateTime 
                      utcDate={match.utcDate} 
                    />
                    {match.location && (
                      <div className="flex flex-col items-end max-w-[240px] leading-tight">
                        <span
                          className="truncate w-full text-right font-medium text-slate-500 dark:text-slate-400"
                          title={match.location}
                        >
                          {match.location.split(" - ")[0]}
                        </span>
                        {match.location.includes(" - ") && (
                          <span
                            className="text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-right"
                            title={match.location.split(" - ")[1]}
                          >
                            {match.location.split(" - ")[1]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="font-medium text-sm truncate max-w-[120px] text-slate-900 dark:text-slate-100">
                        {getTeamName(match.homeTeamId)}
                      </span>
                      <TeamFlag
                        teamName={getTeamName(match.homeTeamId)}
                        className="w-5 h-3.5 shrink-0"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 mx-2">
                      <FlashScoreInput
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
                      <FlashScoreInput
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
                      <TeamFlag
                        teamName={getTeamName(match.awayTeamId)}
                        className="w-5 h-3.5 shrink-0"
                      />
                      <span className="font-medium text-sm truncate max-w-[120px] text-slate-900 dark:text-slate-100">
                        {getTeamName(match.awayTeamId)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
