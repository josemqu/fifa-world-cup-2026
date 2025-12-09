import { Group, KnockoutMatch, Team } from "@/data/types";
import {
  getGroupStandings,
  getSortedThirdPlaceTeams,
} from "@/utils/knockoutUtils";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { Tooltip } from "@/components/ui/Tooltip";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { Info } from "lucide-react";
import { useTournament } from "@/context/TournamentContext";

interface KnockoutStageProps {
  groups: Group[];
  matches: KnockoutMatch[];
  onMatchUpdate: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
}

// Helper component for candidates tooltip
function CandidatesTooltip({
  candidates,
}: {
  candidates: { team: Team; probability: number }[];
}) {
  const sorted = [...candidates].sort((a, b) => b.probability - a.probability);
  const limit = 10;
  const topCandidates = sorted.slice(0, limit);
  const remaining = sorted.length - limit;

  // Use 2 columns if we have more than 5 candidates to show
  const useColumns = topCandidates.length > 5;

  return (
    <div
      className={clsx(
        "flex flex-col gap-1",
        useColumns ? "min-w-[300px]" : "min-w-[150px]"
      )}
    >
      <span className="font-bold text-xs border-b border-slate-700/50 pb-1 mb-1">
        Candidatos Posibles
      </span>
      <div
        className={clsx(
          "grid gap-x-6 gap-y-1",
          useColumns ? "grid-cols-2" : "grid-cols-1"
        )}
      >
        {topCandidates.map((c) => (
          <div
            key={c.team.id}
            className="flex justify-between items-center text-[10px]"
          >
            <span className="truncate max-w-[100px]" title={c.team.name}>
              {c.team.name}
            </span>
            <span className="font-mono text-slate-400 ml-2 shrink-0">
              {(c.probability * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div className="text-[10px] text-slate-400 italic pt-1 text-center border-t border-slate-700/30 mt-1">
          + {remaining} equipos más
        </div>
      )}
    </div>
  );
}

// Helper to render a match card
function MatchCard({
  match,
  roundName,
  onUpdate,
  tooltipPlacement = "top",
}: {
  match: KnockoutMatch;
  roundName: string;
  onUpdate: (
    id: string,
    h: number | null,
    a: number | null,
    hp?: number | null,
    ap?: number | null
  ) => void;
  tooltipPlacement?: "top" | "right" | "bottom" | "left";
}) {
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const prob = match.probabilisticData;

  const isHomeProjected =
    (!homeTeam || "placeholder" in homeTeam) && !!prob?.projectedHomeTeam;
  const isAwayProjected =
    (!awayTeam || "placeholder" in awayTeam) && !!prob?.projectedAwayTeam;

  const displayedHome = isHomeProjected ? prob!.projectedHomeTeam : homeTeam;
  const displayedAway = isAwayProjected ? prob!.projectedAwayTeam : awayTeam;

  const homeName =
    displayedHome && "placeholder" in displayedHome
      ? displayedHome.placeholder
      : displayedHome?.name;
  const awayName =
    displayedAway && "placeholder" in displayedAway
      ? displayedAway.placeholder
      : displayedAway?.name;

  const isHomePlaceholder =
    !displayedHome || "placeholder" in displayedHome || isHomeProjected;
  const isAwayPlaceholder =
    !displayedAway || "placeholder" in displayedAway || isAwayProjected;

  const isMatchupDetermined = !isHomePlaceholder && !isAwayPlaceholder;
  const canEdit =
    !isHomePlaceholder &&
    !isAwayPlaceholder &&
    !isHomeProjected &&
    !isAwayProjected;

  // Check for tie
  const isTied =
    match.homeScore !== null &&
    match.homeScore !== undefined &&
    match.awayScore !== null &&
    match.awayScore !== undefined &&
    match.homeScore === match.awayScore;

  // Check for penalty tie (Invalid state)
  const isPenaltyTied =
    isTied &&
    match.homePenalties !== null &&
    match.homePenalties !== undefined &&
    match.awayPenalties !== null &&
    match.awayPenalties !== undefined &&
    match.homePenalties === match.awayPenalties;

  return (
    <div
      className={clsx(
        "bg-white dark:bg-slate-800 border rounded-lg p-3 shadow-sm min-w-[220px] relative z-10 transition-colors",
        isPenaltyTied
          ? "border-red-300 dark:border-red-900/50"
          : "border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="text-xs text-slate-400 mb-2 flex justify-between items-center">
        <span>Match {match.id}</span>
        {prob &&
          prob.matchupProb > 0 &&
          (prob.matchupProb * 100).toFixed(0) !== "100" &&
          !isMatchupDetermined && (
            <Tooltip
              placement={tooltipPlacement}
              content={
                <div className="flex flex-col gap-1">
                  <span>Probabilidad de cruce entre</span>
                  <span className="font-bold text-yellow-300">
                    {homeName} y {awayName}
                  </span>
                </div>
              }
            >
              <span
                className={clsx(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  prob.matchupProb > 0.8
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : prob.matchupProb > 0.5
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                )}
              >
                {(prob.matchupProb * 100).toFixed(0)}%
              </span>
            </Tooltip>
          )}
      </div>
      {isPenaltyTied && (
        <div
          className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm z-20"
          title="Penalties cannot be tied"
        >
          !
        </div>
      )}
      <div className="flex flex-col gap-2">
        {/* Home Team */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <TeamFlag
                teamName={homeName || ""}
                className="w-5 h-3.5 shrink-0"
              />
              <span
                className={clsx(
                  "font-medium text-sm",
                  isHomePlaceholder
                    ? "text-slate-400 italic"
                    : "text-slate-900 dark:text-slate-100",
                  isHomeProjected && "text-blue-600 dark:text-blue-400"
                )}
                title={homeName}
              >
                {homeName}
              </span>
              {isHomeProjected && (
                <Tooltip
                  placement={tooltipPlacement}
                  content={
                    <CandidatesTooltip
                      candidates={prob?.homeCandidates || []}
                    />
                  }
                >
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 cursor-help" />
                </Tooltip>
              )}
            </div>
            {isHomeProjected &&
              (prob!.homeTeamProb * 100).toFixed(0) !== "100" && (
                <span className="text-[10px] text-blue-500/70 dark:text-blue-400/70 font-mono whitespace-nowrap shrink-0">
                  {(prob!.homeTeamProb * 100).toFixed(0)}%
                </span>
              )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isTied && (
              <input
                type="number"
                min="0"
                className={clsx(
                  "w-5 h-5 text-center text-[10px] font-medium border rounded focus:ring-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50",
                  isPenaltyTied
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-600 focus:ring-red-500 focus:border-red-500"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent"
                )}
                value={match.homePenalties ?? ""}
                onChange={(e) => {
                  const val =
                    e.target.value === "" ? null : parseInt(e.target.value);
                  onUpdate(
                    match.id,
                    match.homeScore ?? null,
                    match.awayScore ?? null,
                    val,
                    match.awayPenalties ?? null
                  );
                }}
                placeholder="P"
                disabled={!canEdit}
              />
            )}
            <input
              type="number"
              min="0"
              className="w-7 h-7 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
              value={match.homeScore ?? ""}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? null : parseInt(e.target.value);
                onUpdate(
                  match.id,
                  val,
                  match.awayScore ?? null,
                  match.homePenalties ?? null,
                  match.awayPenalties ?? null
                );
              }}
              placeholder="-"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Away Team */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <TeamFlag
                teamName={awayName || ""}
                className="w-5 h-3.5 shrink-0"
                showPlaceholder={false}
              />
              <span
                className={clsx(
                  "font-medium text-sm",
                  isAwayPlaceholder
                    ? "text-slate-400 italic"
                    : "text-slate-900 dark:text-slate-100",
                  isAwayProjected && "text-blue-600 dark:text-blue-400"
                )}
                title={awayName}
              >
                {awayName}
              </span>
              {isAwayProjected && (
                <Tooltip
                  placement={tooltipPlacement}
                  content={
                    <CandidatesTooltip
                      candidates={prob?.awayCandidates || []}
                    />
                  }
                >
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 cursor-help" />
                </Tooltip>
              )}
            </div>
            {isAwayProjected &&
              (prob!.awayTeamProb * 100).toFixed(0) !== "100" && (
                <span className="text-[10px] text-blue-500/70 dark:text-blue-400/70 font-mono whitespace-nowrap shrink-0">
                  {(prob!.awayTeamProb * 100).toFixed(0)}%
                </span>
              )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isTied && (
              <input
                type="number"
                min="0"
                className={clsx(
                  "w-5 h-5 text-center text-[10px] font-medium border rounded focus:ring-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50",
                  isPenaltyTied
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-600 focus:ring-red-500 focus:border-red-500"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent"
                )}
                value={match.awayPenalties ?? ""}
                onChange={(e) => {
                  const val =
                    e.target.value === "" ? null : parseInt(e.target.value);
                  onUpdate(
                    match.id,
                    match.homeScore ?? null,
                    match.awayScore ?? null,
                    match.homePenalties ?? null,
                    val
                  );
                }}
                placeholder="P"
                disabled={!canEdit}
              />
            )}
            <input
              type="number"
              min="0"
              className="w-7 h-7 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
              value={match.awayScore ?? ""}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? null : parseInt(e.target.value);
                onUpdate(
                  match.id,
                  match.homeScore ?? null,
                  val,
                  match.homePenalties ?? null,
                  match.awayPenalties ?? null
                );
              }}
              placeholder="-"
              disabled={!canEdit}
            />
          </div>
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
  onUpdate,
  tooltipPlacement,
}: {
  match1: KnockoutMatch;
  match2: KnockoutMatch;
  roundName: string;
  onUpdate: (
    id: string,
    h: number | null,
    a: number | null,
    hp?: number | null,
    ap?: number | null
  ) => void;
  tooltipPlacement?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <div className="flex flex-col justify-around h-full relative mb-4">
      <MatchCard
        match={match1}
        roundName={roundName}
        onUpdate={onUpdate}
        tooltipPlacement={tooltipPlacement}
      />
      <MatchCard
        match={match2}
        roundName={roundName}
        onUpdate={onUpdate}
        tooltipPlacement={tooltipPlacement}
      />

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

const STAGES = [
  {
    id: "r32",
    label: "16avos de Final",
    colStart: 1,
    bgClass: "bg-blue-50/50 dark:bg-blue-900/10",
    headerClass:
      "bg-blue-100/95 dark:bg-blue-900/90 text-blue-700 dark:text-blue-300",
  },
  {
    id: "r16",
    label: "Octavos de Final",
    colStart: 2,
    bgClass: "bg-indigo-50/50 dark:bg-indigo-900/10",
    headerClass:
      "bg-indigo-100/95 dark:bg-indigo-900/90 text-indigo-700 dark:text-indigo-300",
  },
  {
    id: "qf",
    label: "Cuartos de Final",
    colStart: 3,
    bgClass: "bg-violet-50/50 dark:bg-violet-900/10",
    headerClass:
      "bg-violet-100/95 dark:bg-violet-900/90 text-violet-700 dark:text-violet-300",
  },
  {
    id: "sf",
    label: "Semifinales",
    colStart: 4,
    bgClass: "bg-purple-50/50 dark:bg-purple-900/10",
    headerClass:
      "bg-purple-100/95 dark:bg-purple-900/90 text-purple-700 dark:text-purple-300",
  },
  {
    id: "f",
    label: "Finales",
    colStart: 5,
    bgClass: "bg-fuchsia-50/50 dark:bg-fuchsia-900/10",
    headerClass:
      "bg-fuchsia-100/95 dark:bg-fuchsia-900/90 text-fuchsia-700 dark:text-fuchsia-300",
  },
] as const;

export function KnockoutStage({
  groups,
  matches,
  onMatchUpdate,
}: KnockoutStageProps) {
  const { simulateKnockout, simulateAll } = useTournament();
  const { thirdPlaceTeams } = getGroupStandings(groups);
  const sortedThirds = getSortedThirdPlaceTeams(thirdPlaceTeams);

  // Helper to chunk matches into pairs
  const pairMatches = (matchList: KnockoutMatch[]) => {
    const pairs = [];
    for (let i = 0; i < matchList.length; i += 2) {
      pairs.push({ m1: matchList[i], m2: matchList[i + 1] });
    }
    return pairs;
  };

  const r32Matches = matches
    .filter((m) => m.stage === "R32")
    .sort((a, b) => Number(a.id) - Number(b.id));
  const r16Matches = matches
    .filter((m) => m.stage === "R16")
    .sort((a, b) => Number(a.id) - Number(b.id));
  const qfMatches = matches
    .filter((m) => m.stage === "QF")
    .sort((a, b) => Number(a.id) - Number(b.id));
  const sfMatches = matches
    .filter((m) => m.stage === "SF")
    .sort((a, b) => Number(a.id) - Number(b.id));

  const finalMatch = matches.find((m) => m.id === "104");
  const thirdPlaceMatch = matches.find((m) => m.id === "103");

  const r32Pairs = pairMatches(r32Matches);
  const r16Pairs = pairMatches(r16Matches);
  const qfPairs = pairMatches(qfMatches);
  const sfPairs = pairMatches(sfMatches);

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div
          className="grid gap-x-12 gap-y-4 min-w-max px-4"
          style={{
            gridTemplateColumns: "repeat(5, minmax(240px, 1fr))",
            gridTemplateRows: "auto repeat(8, minmax(220px, auto)) auto",
          }}
        >
          {/* Stage Backgrounds & Headers */}
          {STAGES.map((stage) => (
            <div key={`stage-group-${stage.id}`} className="contents">
              {/* Background Column */}
              <div
                key={`bg-${stage.id}`}
                className={clsx(
                  "row-start-1 row-span-full rounded-2xl -mx-4",
                  stage.bgClass
                )}
                style={{ gridColumnStart: stage.colStart }}
              />
              {/* Top Header */}
              <div
                key={`top-header-${stage.id}`}
                className="row-start-1"
                style={{ gridColumnStart: stage.colStart }}
              >
                <h3
                  className={clsx(
                    "text-center py-2 px-3 rounded-xl font-semibold text-sm mb-4 -mx-4",
                    stage.headerClass
                  )}
                >
                  {stage.label}
                </h3>
              </div>
              {/* Bottom Header */}
              <div
                key={`bottom-header-${stage.id}`}
                className="row-start-10"
                style={{ gridColumnStart: stage.colStart }}
              >
                <h3
                  className={clsx(
                    "text-center py-2 px-3 rounded-xl font-semibold text-sm mt-4 -mx-4",
                    stage.headerClass
                  )}
                >
                  {stage.label}
                </h3>
              </div>
            </div>
          ))}

          {/* Round of 32 */}
          {r32Pairs.map((pair, i) => (
            <div
              key={`r32-${i}`}
              className="col-start-1"
              style={{ gridRow: i + 2 }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="R32"
                onUpdate={onMatchUpdate}
                tooltipPlacement="right"
              />
            </div>
          ))}

          {/* Round of 16 */}
          {r16Pairs.map((pair, i) => (
            <div
              key={`r16-${i}`}
              className="col-start-2"
              style={{ gridRow: `${i * 2 + 2} / span 2` }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="R16"
                onUpdate={onMatchUpdate}
              />
            </div>
          ))}

          {/* Quarter Finals */}
          {qfPairs.map((pair, i) => (
            <div
              key={`qf-${i}`}
              className="col-start-3"
              style={{ gridRow: `${i * 4 + 2} / span 4` }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="QF"
                onUpdate={onMatchUpdate}
              />
            </div>
          ))}

          {/* Semi Finals */}
          {sfPairs.map((pair, i) => (
            <div
              key={`sf-${i}`}
              className="col-start-4"
              style={{ gridRow: `${i * 8 + 2} / span 8` }}
            >
              <MatchPair
                match1={pair.m1}
                match2={pair.m2}
                roundName="SF"
                onUpdate={onMatchUpdate}
              />
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
                  Final
                </h4>
                <MatchCard
                  match={finalMatch}
                  roundName="Final"
                  onUpdate={onMatchUpdate}
                />
                {/* Incoming Line Connector */}
                <div className="absolute top-1/2 left-0 w-4 h-[2px] bg-slate-300 dark:bg-slate-600 transform -translate-y-1/2 -translate-x-full" />
              </div>
            )}

            {/* 3rd Place Match - Bottom */}
            {thirdPlaceMatch && (
              <div className="absolute top-1/2 left-0 right-0 mt-32 z-10">
                <h4 className="text-sm font-semibold text-center mb-2 text-slate-500">
                  Tercer Puesto
                </h4>
                <MatchCard
                  match={thirdPlaceMatch}
                  roundName="3rdPlace"
                  onUpdate={onMatchUpdate}
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
                        <TeamFlag
                          teamName={team.name}
                          className="w-5 h-3.5 shadow-sm"
                        />
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
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3 items-end">
        <button
          onClick={simulateKnockout}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-full font-medium transition-all shadow-xl flex items-center gap-2 hover:scale-105 hover:shadow-2xl"
          title="Simular resultados de la Fase Eliminatoria"
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
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Simular Eliminatoria
        </button>

        <button
          onClick={simulateAll}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2.5 rounded-full font-medium transition-all shadow-xl flex items-center gap-2 hover:scale-105 hover:shadow-2xl"
          title="Simular todo el torneo"
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
              d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.596-.218.797.065a.97.97 0 01-.19 1.316 5.061 5.061 0 00-.754.646.97.97 0 000 1.364l.015.015a.97.97 0 001.364 0l.015-.015a.97.97 0 011.364 0l.646.646a.97.97 0 001.364 0l.015-.015a.97.97 0 000-1.364l-.015-.015a.97.97 0 010-1.364l.646-.646a.97.97 0 000-1.364l-.015-.015a.97.97 0 00-1.364 0l-.015.015a.97.97 0 01-1.364 0l-.646-.646a.97.97 0 00-.22-.168zM10 18a8 8 0 100-16 8 8 0 000 16z"
              clipRule="evenodd"
            />
          </svg>
          Simular Todo
        </button>
      </div>
    </motion.div>
  );
}
