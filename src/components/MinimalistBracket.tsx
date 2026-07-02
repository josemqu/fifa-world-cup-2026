"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { KnockoutMatch, Team, Group } from "@/data/types";
import { Tooltip } from "@/components/ui/Tooltip";
import Flag from "react-world-flags";
import { getCountryIsoCode } from "@/utils/countries";
import { Trophy, X, Zap, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useTournament } from "@/context/TournamentContext";
import { CandidatesTooltip } from "./KnockoutStage";
import { CircularBracketView } from "./CircularBracketView";

interface MinimalistBracketProps {
  groups: Group[];
  matches: KnockoutMatch[];
  onMatchUpdate: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null,
    finished?: boolean,
    status?: "scheduled" | "live" | "halftime" | "finished",
    elapsed?: number | null,
    homeScorers?: any[],
    awayScorers?: any[],
  ) => void;
  onClose: () => void;
}

// Left side connector lines
interface ConnectorProps {
  rowSpan: number;
  highlightTop?: boolean;
  highlightBottom?: boolean;
  highlightOutput?: boolean;
  style?: React.CSSProperties;
  team?: any;
  match?: KnockoutMatch;
  roundName?: string;
  renderTeamCircle: (team: any, match: KnockoutMatch | undefined, roundName: string, type?: "home" | "away" | "winner") => React.ReactNode;
}

function LeftConnector({
  rowSpan,
  highlightTop,
  highlightBottom,
  highlightOutput,
  style,
  team,
  match,
  roundName,
  renderTeamCircle,
}: ConnectorProps) {
  return (
    <div
      className="relative w-full h-full pointer-events-none"
      style={{ ...style, gridRow: `${style?.gridRowStart} / span ${rowSpan}` }}
    >
      {/* Top horizontal branch */}
      <div
        className={clsx(
          "absolute top-1/4 left-0 h-[2px] -translate-y-1/2 transition-colors duration-300",
          highlightTop ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ right: "calc(50% - 1px)" }}
      />
      {/* Bottom horizontal branch */}
      <div
        className={clsx(
          "absolute top-3/4 left-0 h-[2px] -translate-y-1/2 transition-colors duration-300",
          highlightBottom ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ right: "calc(50% - 1px)" }}
      />
      {/* Top half vertical connection */}
      <div
        className={clsx(
          "absolute left-1/2 w-[2px] -translate-x-1/2 transition-colors duration-300",
          highlightTop ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ top: "calc(25% - 1px)", height: "calc(25% + 2px)" }}
      />
      {/* Bottom half vertical connection */}
      <div
        className={clsx(
          "absolute left-1/2 w-[2px] -translate-x-1/2 transition-colors duration-300",
          highlightBottom ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ top: "calc(50% - 1px)", height: "calc(25% + 2px)" }}
      />
      {/* Output branch to next round */}
      <div
        className={clsx(
          "absolute top-1/2 right-0 h-[2px] -translate-y-1/2 transition-colors duration-300",
          highlightOutput ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ left: "calc(50% - 1px)" }}
      />
      {/* Circle at the junction */}
      {match !== undefined && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          {renderTeamCircle(team, match, roundName || "", "winner")}
        </div>
      )}
    </div>
  );
}

// Right side connector lines
function RightConnector({
  rowSpan,
  highlightTop,
  highlightBottom,
  highlightOutput,
  style,
  team,
  match,
  roundName,
  renderTeamCircle,
}: ConnectorProps) {
  return (
    <div
      className="relative w-full h-full pointer-events-none"
      style={{ ...style, gridRow: `${style?.gridRowStart} / span ${rowSpan}` }}
    >
      {/* Top horizontal branch */}
      <div
        className={clsx(
          "absolute top-1/4 right-0 h-[2px] -translate-y-1/2 transition-colors duration-300",
          highlightTop ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ left: "calc(50% - 1px)" }}
      />
      {/* Bottom horizontal branch */}
      <div
        className={clsx(
          "absolute top-3/4 right-0 h-[2px] -translate-y-1/2 transition-colors duration-300",
          highlightBottom ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ left: "calc(50% - 1px)" }}
      />
      {/* Top half vertical connection */}
      <div
        className={clsx(
          "absolute left-1/2 w-[2px] -translate-x-1/2 transition-colors duration-300",
          highlightTop ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ top: "calc(25% - 1px)", height: "calc(25% + 2px)" }}
      />
      {/* Bottom half vertical connection */}
      <div
        className={clsx(
          "absolute left-1/2 w-[2px] -translate-x-1/2 transition-colors duration-300",
          highlightBottom ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ top: "calc(50% - 1px)", height: "calc(25% + 2px)" }}
      />
      {/* Output branch to next round */}
      <div
        className={clsx(
          "absolute top-1/2 left-0 h-[2px] -translate-y-1/2 transition-colors duration-300",
          highlightOutput ? "bg-slate-200 dark:bg-slate-200" : "bg-slate-800 dark:bg-slate-800"
        )}
        style={{ right: "calc(50% - 1px)" }}
      />
      {/* Circle at the junction */}
      {match !== undefined && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          {renderTeamCircle(team, match, roundName || "", "winner")}
        </div>
      )}
    </div>
  );
}

export function MinimalistBracket({
  groups,
  matches,
  onMatchUpdate,
  onClose,
}: MinimalistBracketProps) {
  const { dbUser, user } = useAuth();
  const { simulateAll, resetTournament } = useTournament();

  const isAdmin = useMemo(() => {
    return dbUser?.role === "admin" ||
      !!user?.email?.toLowerCase().includes("mailjmq") ||
      !!dbUser?.email?.toLowerCase().includes("mailjmq");
  }, [dbUser, user]);

  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"linear" | "circular">("linear");

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("bracket_view_mode") as "linear" | "circular";
    if (savedMode === "linear" || savedMode === "circular") {
      setViewMode(savedMode);
    }
  }, []);

  const handleSetViewMode = (mode: "linear" | "circular") => {
    setViewMode(mode);
    localStorage.setItem("bracket_view_mode", mode);
  };

  // Organize matches by IDs
  const matchesMap = useMemo(() => {
    return new Map<string, KnockoutMatch>(matches.map((m) => [m.id, m]));
  }, [matches]);

  // Matches arrays in proper tree order
  const leftR32Ids = ["74", "77", "73", "75", "83", "84", "81", "82"];
  const leftR16Ids = ["89", "90", "93", "94"];
  const leftQFIds = ["97", "98"];
  const leftSFIds = ["101"];

  const rightR32Ids = ["76", "78", "79", "80", "86", "88", "85", "87"];
  const rightR16Ids = ["91", "92", "95", "96"];
  const rightQFIds = ["99", "100"];
  const rightSFIds = ["102"];

  const finalMatchId = "104";

  // Helpers to get match info cleanly
  const getMatch = useCallback((id: string) => matchesMap.get(id), [matchesMap]);

  // Helpers to get team info from match
  const getTeamName = (team: any, match?: KnockoutMatch) => {
    if (!team) {
      if (match) return `W${match.id}`;
      return "TBD";
    }
    if ("placeholder" in team) return team.placeholder;
    return team.name;
  };

  const isPlaceholderTeam = (team: any) => {
    return !team || "placeholder" in team;
  };

  const isSameTeam = (teamA: any, teamB: any) => {
    if (!teamA || !teamB) return false;
    if ("placeholder" in teamA || "placeholder" in teamB) return false;
    return teamA.name === teamB.name;
  };

  // Render a team circle (flag or placeholder)
  const renderTeamCircle = (
    team: any,
    match: KnockoutMatch | undefined,
    roundName: string,
    type?: "home" | "away" | "winner"
  ) => {
    const isPH = isPlaceholderTeam(team);
    const name = getTeamName(team, match);

    const circleContent = (
      <div
        className={clsx(
          "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-md select-none transition-all duration-200 border",
          isPH
            ? "bg-slate-100 dark:bg-slate-800 border-slate-700 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[8px] md:text-[10px] font-black"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-200 hover:scale-115 hover:shadow-lg"
        )}
      >
        {isPH ? (
          <span className="font-mono tracking-tighter text-[6px] md:text-[8px]"></span>
        ) : (() => {
          const code = getCountryIsoCode(name);
          if (!code) return <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-full" />;
          return (
            <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-white aspect-square">
              <Flag
                code={code}
                className="object-cover w-full h-full aspect-square rounded-full scale-105"
                alt={name}
              />
            </div>
          );
        })()}
      </div>
    );

    if (isPH) {
      const candidates = match ? (
        type === "winner"
          ? match.probabilisticData?.winnerCandidates
          : (type === "home" ? match.probabilisticData?.homeCandidates : match.probabilisticData?.awayCandidates)
      ) : undefined;
      const hasCandidates = candidates && candidates.length > 0;

      if (hasCandidates) {
        return (
          <Tooltip
            content={<CandidatesTooltip candidates={candidates} />}
            placement="top"
            interactive={false}
            wrapperClassName="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 z-20"
          >
            {circleContent}
          </Tooltip>
        );
      }

      return (
        <div className="flex items-center justify-center w-full h-full relative z-20">
          {circleContent}
        </div>
      );
    }

    return (
      <Tooltip
        content={<span className="font-bold text-xs">{name}</span>}
        placement="top"
        interactive={false}
        wrapperClassName="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 z-20"
      >
        {circleContent}
      </Tooltip>
    );
  };

  const finalMatch = getMatch(finalMatchId);
  const champion = finalMatch?.winner;

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 border border-slate-800/80 rounded-3xl p-6 relative w-full max-w-[1400px] h-full max-h-[92vh] md:max-h-[850px] flex flex-col justify-between shadow-2xl backdrop-blur-xl"
      >

        {/* View Mode Toggle — centered on mobile, top-left on desktop */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 z-30 flex items-center bg-slate-800/80 border border-slate-700/50 p-0.5 rounded-full backdrop-blur-md shadow-md">
          <button
            onClick={() => handleSetViewMode("linear")}
            className={clsx(
              "px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer",
              viewMode === "linear" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Lineal
          </button>
          <button
            onClick={() => handleSetViewMode("circular")}
            className={clsx(
              "px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer",
              viewMode === "circular" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Circular
          </button>
        </div>

        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors cursor-pointer border border-slate-700/40"
          title="Cerrar modal (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Conditional Content: Linear Grid or Circular Bracket */}
        {viewMode === "linear" ? (
          <div className="absolute inset-6 flex items-center justify-center overflow-hidden">
            <div
              className="grid gap-y-0 w-full max-w-[800px] items-stretch justify-items-stretch grid-cols-[24px_1.2fr_1.4fr_1.6fr_1.8fr_0.5fr_1.8fr_1.6fr_1.4fr_1.2fr_24px] md:grid-cols-[32px_1.5fr_1.8fr_2.0fr_2.2fr_2.2fr_2.2fr_2.0fr_1.8fr_1.5fr_32px]"
              style={{
                gridTemplateRows: "repeat(16, minmax(0, 1fr))",
                height: "min(calc(92vh - 56px), 780px)",
              }}
            >
              {/* --- LEFT SIDE BRACKET --- */}

              {/* Left Col 1: R32 Circles */}
              {leftR32Ids.map((id, index) => {
                const m = getMatch(id);
                return (
                  <React.Fragment key={`l-r32-${id}`}>
                    <div className="flex items-center justify-center" style={{ gridColumn: 1, gridRowStart: index * 2 + 1 }}>
                      {renderTeamCircle(m?.homeTeam, m, "16avos", "home")}
                    </div>
                    <div className="flex items-center justify-center" style={{ gridColumn: 1, gridRowStart: index * 2 + 2 }}>
                      {renderTeamCircle(m?.awayTeam, m, "16avos", "away")}
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Left Col 2: R32-R16 Connectors */}
              {leftR32Ids.map((id, index) => {
                const r32Match = getMatch(id);
                const r16Match = getMatch(leftR16Ids[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(r32Match?.winner, r32Match?.homeTeam);
                const highlightBottom = isSameTeam(r32Match?.winner, r32Match?.awayTeam);
                const highlightOutput = !!(r32Match?.winner && r16Match?.winner && isSameTeam(r32Match.winner, r16Match.winner));

                return (
                  <LeftConnector
                    key={`l-conn-r32-${id}`}
                    rowSpan={2}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 2, gridRowStart: index * 2 + 1, zIndex: 10 }}
                    team={r32Match?.winner}
                    match={r32Match}
                    roundName="Octavos"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}

              {/* Left Col 3: R16-QF Connectors */}
              {leftR16Ids.map((id, index) => {
                const r16Match = getMatch(id);
                const qfMatch = getMatch(leftQFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(r16Match?.winner, r16Match?.homeTeam);
                const highlightBottom = isSameTeam(r16Match?.winner, r16Match?.awayTeam);
                const highlightOutput = !!(r16Match?.winner && qfMatch?.winner && isSameTeam(r16Match.winner, qfMatch.winner));

                return (
                  <LeftConnector
                    key={`l-conn-r16-${id}`}
                    rowSpan={4}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 3, gridRowStart: index * 4 + 1, zIndex: 9 }}
                    team={r16Match?.winner}
                    match={r16Match}
                    roundName="Cuartos"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}

              {/* Left Col 4: QF-SF Connectors */}
              {leftQFIds.map((id, index) => {
                const qfMatch = getMatch(id);
                const sfMatch = getMatch(leftSFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(qfMatch?.winner, qfMatch?.homeTeam);
                const highlightBottom = isSameTeam(qfMatch?.winner, qfMatch?.awayTeam);
                const highlightOutput = !!(qfMatch?.winner && sfMatch?.winner && isSameTeam(qfMatch.winner, sfMatch.winner));

                return (
                  <LeftConnector
                    key={`l-conn-qf-${id}`}
                    rowSpan={8}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 4, gridRowStart: index * 8 + 1, zIndex: 8 }}
                    team={qfMatch?.winner}
                    match={qfMatch}
                    roundName="Semifinal"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}

              {/* Left Col 5: SF-Finalist Connector */}
              {leftSFIds.map((id, index) => {
                const sfMatch = getMatch(id);
                const finalMatch = getMatch(finalMatchId);
                const highlightTop = isSameTeam(sfMatch?.winner, sfMatch?.homeTeam);
                const highlightBottom = isSameTeam(sfMatch?.winner, sfMatch?.awayTeam);
                const highlightOutput = !!(sfMatch?.winner && finalMatch?.winner && isSameTeam(sfMatch.winner, finalMatch.winner));

                return (
                  <LeftConnector
                    key={`l-conn-sf-${id}`}
                    rowSpan={16}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 5, gridRowStart: 1, zIndex: 7 }}
                    team={sfMatch?.winner}
                    match={sfMatch}
                    roundName="Final"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}


              {/* --- CENTER ZONE (Final & Trophy) --- */}

              <div className="col-start-6 row-start-1 row-span-full relative flex flex-col items-center justify-start pt-16 md:justify-center md:pt-0">
                {/* Symmetrical central horizontal bracket connector line */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-800 dark:bg-slate-800 -translate-y-1/2 z-0 pointer-events-none" />

                {/* Active Highlight Lines for Finalists */}
                {finalMatch?.homeTeam && !isPlaceholderTeam(finalMatch.homeTeam) && isSameTeam(champion, finalMatch.homeTeam) && (
                  <div className="absolute top-1/2 left-0 right-1/2 h-[2px] bg-slate-200 dark:bg-slate-200 -translate-y-1/2 z-0 pointer-events-none" />
                )}
                {finalMatch?.awayTeam && !isPlaceholderTeam(finalMatch.awayTeam) && isSameTeam(champion, finalMatch.awayTeam) && (
                  <div className="absolute top-1/2 left-1/2 right-0 h-[2px] bg-slate-200 dark:bg-slate-200 -translate-y-1/2 z-0 pointer-events-none" />
                )}

                {/* Symmetrical central vertical connector line for mobile */}
                <div className={clsx(
                  "absolute top-[100px] bottom-1/2 left-1/2 w-[2px] -translate-x-1/2 z-0 pointer-events-none transition-colors duration-300 md:hidden",
                  champion ? "bg-yellow-500" : "bg-slate-800 dark:bg-slate-800"
                )} />

                {/* Symmetrical Central Content */}
                <div className="z-10 flex flex-col items-center bg-slate-900 border border-slate-800 px-3 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl shadow-xl backdrop-blur-md max-w-[115px] md:max-w-[140px] text-center">
                  {/* Champion Banner above Trophy if resolved */}
                  {champion && (
                    <div className="flex flex-col items-center justify-center h-5 md:h-6 mb-1.5 md:mb-3 animate-bounce-subtle">
                      <span className="text-[7px] md:text-[9px] font-black text-yellow-500 tracking-widest uppercase">
                        🏆 CAMPEÓN
                      </span>
                    </div>
                  )}

                  {/* Premium Trophy Graphic or Champion Flag */}
                  <div className={clsx(
                    "relative flex items-center justify-center transition-all duration-500 rounded-full border shadow-inner select-none",
                    champion
                      ? "w-14 h-14 md:w-20 md:h-20 border-yellow-400 dark:border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)] bg-white dark:bg-slate-900 p-0.5 overflow-hidden"
                      : "w-10 h-10 md:w-14 md:h-14 bg-slate-800 border-slate-700 text-slate-500 p-2 md:p-3"
                  )}>
                    {champion ? (() => {
                      const code = getCountryIsoCode(champion.name);
                      return (
                        <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-white aspect-square">
                          <Flag
                            code={code}
                            className="object-cover w-full h-full aspect-square rounded-full scale-105"
                            alt={champion.name}
                          />
                        </div>
                      );
                    })() : (
                      <Trophy className="w-5 h-5 md:w-8 md:h-8" />
                    )}
                  </div>

                  {/* Champion Name Chip below Trophy if resolved */}
                  {champion && (
                    <div className="flex flex-col items-center justify-center h-5 md:h-6 mt-1.5 md:mt-3">
                      <div className="flex items-center gap-1 bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/40 text-yellow-800 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-black text-[8px] md:text-[10px] shadow-xs">
                        <Flag code={getCountryIsoCode(champion.name)} className="w-2.5 h-2 md:w-3.5 md:h-2.5 rounded-xs object-cover" />
                        <span className="truncate max-w-[60px] md:max-w-[70px]">{champion.name}</span>
                      </div>
                    </div>
                  )}
                </div>


              </div>


              {/* --- RIGHT SIDE BRACKET --- */}

              {/* Right Col 5: SF-Finalist Connector */}
              {rightSFIds.map((id, index) => {
                const sfMatch = getMatch(id);
                const finalMatch = getMatch(finalMatchId);
                const highlightTop = isSameTeam(sfMatch?.winner, sfMatch?.homeTeam);
                const highlightBottom = isSameTeam(sfMatch?.winner, sfMatch?.awayTeam);
                const highlightOutput = !!(sfMatch?.winner && finalMatch?.winner && isSameTeam(sfMatch.winner, finalMatch.winner));

                return (
                  <RightConnector
                    key={`r-conn-sf-${id}`}
                    rowSpan={16}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 7, gridRowStart: 1, zIndex: 7 }}
                    team={sfMatch?.winner}
                    match={sfMatch}
                    roundName="Final"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}

              {/* Right Col 4: QF-SF Connectors */}
              {rightQFIds.map((id, index) => {
                const qfMatch = getMatch(id);
                const sfMatch = getMatch(rightSFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(qfMatch?.winner, qfMatch?.homeTeam);
                const highlightBottom = isSameTeam(qfMatch?.winner, qfMatch?.awayTeam);
                const highlightOutput = !!(qfMatch?.winner && sfMatch?.winner && isSameTeam(qfMatch.winner, sfMatch.winner));

                return (
                  <RightConnector
                    key={`r-conn-qf-${id}`}
                    rowSpan={8}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 8, gridRowStart: index * 8 + 1, zIndex: 8 }}
                    team={qfMatch?.winner}
                    match={qfMatch}
                    roundName="Semifinal"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}

              {/* Right Col 3: R16-QF Connectors */}
              {rightR16Ids.map((id, index) => {
                const r16Match = getMatch(id);
                const qfMatch = getMatch(rightQFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(r16Match?.winner, r16Match?.homeTeam);
                const highlightBottom = isSameTeam(r16Match?.winner, r16Match?.awayTeam);
                const highlightOutput = !!(r16Match?.winner && qfMatch?.winner && isSameTeam(r16Match.winner, qfMatch.winner));

                return (
                  <RightConnector
                    key={`r-conn-r16-${id}`}
                    rowSpan={4}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 9, gridRowStart: index * 4 + 1, zIndex: 9 }}
                    team={r16Match?.winner}
                    match={r16Match}
                    roundName="Cuartos"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}

              {/* Right Col 2: R32-R16 Connectors */}
              {rightR32Ids.map((id, index) => {
                const r32Match = getMatch(id);
                const r16Match = getMatch(rightR16Ids[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(r32Match?.winner, r32Match?.homeTeam);
                const highlightBottom = isSameTeam(r32Match?.winner, r32Match?.awayTeam);
                const highlightOutput = !!(r32Match?.winner && r16Match?.winner && isSameTeam(r32Match.winner, r16Match.winner));

                return (
                  <RightConnector
                    key={`r-conn-r32-${id}`}
                    rowSpan={2}
                    highlightTop={highlightTop}
                    highlightBottom={highlightBottom}
                    highlightOutput={highlightOutput}
                    style={{ gridColumn: 10, gridRowStart: index * 2 + 1, zIndex: 10 }}
                    team={r32Match?.winner}
                    match={r32Match}
                    roundName="Octavos"
                    renderTeamCircle={renderTeamCircle}
                  />
                );
              })}

              {/* Right Col 1: R32 Circles */}
              {rightR32Ids.map((id, index) => {
                const m = getMatch(id);
                return (
                  <React.Fragment key={`r-r32-${id}`}>
                    <div className="flex items-center justify-center" style={{ gridColumn: 11, gridRowStart: index * 2 + 1 }}>
                      {renderTeamCircle(m?.homeTeam, m, "16avos", "home")}
                    </div>
                    <div className="flex items-center justify-center" style={{ gridColumn: 11, gridRowStart: index * 2 + 2 }}>
                      {renderTeamCircle(m?.awayTeam, m, "16avos", "away")}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <CircularBracketView
            matches={matches}
            isAdmin={isAdmin}
            simulateAll={simulateAll}
            resetTournament={resetTournament}
          />
        )}

        {/* Unified Admin Floating Buttons — centered/horizontal on mobile, bottom-left/vertical on desktop */}
        {isAdmin && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 flex flex-row md:flex-col gap-2 z-30 animate-fade-in">
            <button
              onClick={simulateAll}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer w-28"
              title="Simular todo el torneo"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simular</span>
            </button>
            <button
              onClick={resetTournament}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer w-28"
              title="Limpiar todos los resultados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
