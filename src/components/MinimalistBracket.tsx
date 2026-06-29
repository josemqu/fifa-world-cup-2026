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
}

function LeftConnector({ rowSpan, highlightTop, highlightBottom, highlightOutput, style }: ConnectorProps) {
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
    </div>
  );
}

// Right side connector lines
function RightConnector({ rowSpan, highlightTop, highlightBottom, highlightOutput, style }: ConnectorProps) {
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const getTeamName = (team: any) => {
    if (!team) return "Por definir";
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
  const renderTeamCircle = (team: any, match: KnockoutMatch | undefined, roundName: string) => {
    const isPH = isPlaceholderTeam(team);
    const name = getTeamName(team);

    const circleContent = (
      <div
        className={clsx(
          "w-8 h-8 rounded-full flex items-center justify-center shadow-md select-none transition-all duration-200 border",
          isPH
            ? "bg-slate-100 dark:bg-slate-800 border-slate-700 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-200 hover:scale-115 hover:shadow-lg"
        )}
      >
        {isPH ? (
          <span className="font-mono tracking-tighter text-[8px]">{name}</span>
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
      return (
        <div className="flex items-center justify-center w-full h-full">
          {circleContent}
        </div>
      );
    }

    return (
      <Tooltip
        content={<span className="font-bold text-xs">{name}</span>}
        placement="top"
        interactive={false}
        wrapperClassName="flex items-center justify-center w-8 h-8"
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
        className="bg-slate-900/95 border border-slate-800/80 rounded-3xl p-6 relative w-full max-w-[1400px] h-full max-h-[850px] flex flex-col justify-between shadow-2xl backdrop-blur-xl"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">El camino del campeón</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 19-Column Flat Grid Symmetrical Tree Layout */}
        <div
          className="grid gap-y-0 w-full max-w-[1280px] mx-auto items-stretch justify-items-stretch flex-1"
          style={{
            gridTemplateColumns: "32px 1fr 32px 1.2fr 32px 1.4fr 32px 1.6fr 32px 2.2fr 32px 1.6fr 32px 1.4fr 32px 1.2fr 32px 1fr 32px",
            gridTemplateRows: "repeat(16, minmax(0, 1fr))",
            height: isAdmin ? "calc(100% - 120px)" : "calc(100% - 60px)",
          }}
        >
          {/* --- LEFT SIDE BRACKET --- */}

          {/* Left Col 1: R32 Circles */}
          {leftR32Ids.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`l-r32-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 1, gridRowStart: index * 2 + 1 }}>
                  {renderTeamCircle(m?.homeTeam, m, "16avos")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 1, gridRowStart: index * 2 + 2 }}>
                  {renderTeamCircle(m?.awayTeam, m, "16avos")}
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
            const highlightOutput = !isPlaceholderTeam(r32Match?.winner);

            return (
              <LeftConnector
                key={`l-conn-r32-${id}`}
                rowSpan={2}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 2, gridRowStart: index * 2 + 1 }}
              />
            );
          })}

          {/* Left Col 3: R16 Circles */}
          {leftR16Ids.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`l-r16-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 3, gridRow: `${index * 4 + 1} / span 2` }}>
                  {renderTeamCircle(m?.homeTeam, m, "Octavos")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 3, gridRow: `${index * 4 + 3} / span 2` }}>
                  {renderTeamCircle(m?.awayTeam, m, "Octavos")}
                </div>
              </React.Fragment>
            );
          })}

          {/* Left Col 4: R16-QF Connectors */}
          {leftR16Ids.map((id, index) => {
            const r16Match = getMatch(id);
            const qfMatch = getMatch(leftQFIds[Math.floor(index / 2)]);

            const highlightTop = isSameTeam(r16Match?.winner, r16Match?.homeTeam);
            const highlightBottom = isSameTeam(r16Match?.winner, r16Match?.awayTeam);
            const highlightOutput = !isPlaceholderTeam(r16Match?.winner);

            return (
              <LeftConnector
                key={`l-conn-r16-${id}`}
                rowSpan={4}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 4, gridRowStart: index * 4 + 1 }}
              />
            );
          })}

          {/* Left Col 5: QF Circles */}
          {leftQFIds.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`l-qf-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 5, gridRow: `${index * 8 + 1} / span 4` }}>
                  {renderTeamCircle(m?.homeTeam, m, "Cuartos")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 5, gridRow: `${index * 8 + 5} / span 4` }}>
                  {renderTeamCircle(m?.awayTeam, m, "Cuartos")}
                </div>
              </React.Fragment>
            );
          })}

          {/* Left Col 6: QF-SF Connectors */}
          {leftQFIds.map((id, index) => {
            const qfMatch = getMatch(id);
            const sfMatch = getMatch(leftSFIds[Math.floor(index / 2)]);

            const highlightTop = isSameTeam(qfMatch?.winner, qfMatch?.homeTeam);
            const highlightBottom = isSameTeam(qfMatch?.winner, qfMatch?.awayTeam);
            const highlightOutput = !isPlaceholderTeam(qfMatch?.winner);

            return (
              <LeftConnector
                key={`l-conn-qf-${id}`}
                rowSpan={8}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 6, gridRowStart: index * 8 + 1 }}
              />
            );
          })}

          {/* Left Col 7: SF Circles */}
          {leftSFIds.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`l-sf-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 7, gridRow: `${index * 16 + 1} / span 8` }}>
                  {renderTeamCircle(m?.homeTeam, m, "Semifinal")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 7, gridRow: `${index * 16 + 9} / span 8` }}>
                  {renderTeamCircle(m?.awayTeam, m, "Semifinal")}
                </div>
              </React.Fragment>
            );
          })}

          {/* Left Col 8: SF-Finalist Connector */}
          {leftSFIds.map((id, index) => {
            const sfMatch = getMatch(id);
            
            const highlightTop = isSameTeam(sfMatch?.winner, sfMatch?.homeTeam);
            const highlightBottom = isSameTeam(sfMatch?.winner, sfMatch?.awayTeam);
            const highlightOutput = !isPlaceholderTeam(sfMatch?.winner);

            return (
              <LeftConnector
                key={`l-conn-sf-${id}`}
                rowSpan={16}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 8, gridRowStart: 1 }}
              />
            );
          })}

          {/* Left Col 9: Finalist Circle */}
          <div className="flex items-center justify-center" style={{ gridColumn: 9, gridRow: "1 / span 16" }}>
            {renderTeamCircle(finalMatch?.homeTeam, finalMatch, "Final")}
          </div>


          {/* --- CENTER ZONE (Final & Trophy) --- */}

          <div className="col-start-10 row-start-1 row-span-full relative flex flex-col items-center justify-center">
            {/* Symmetrical central horizontal bracket connector line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-800 dark:bg-slate-800 -translate-y-1/2 z-0 pointer-events-none" />

            {/* Active Highlight Lines for Finalists */}
            {finalMatch?.homeTeam && !isPlaceholderTeam(finalMatch.homeTeam) && (
              <div className="absolute top-1/2 left-0 right-1/2 h-[2px] bg-slate-200 dark:bg-slate-200 -translate-y-1/2 z-0 pointer-events-none" />
            )}
            {finalMatch?.awayTeam && !isPlaceholderTeam(finalMatch.awayTeam) && (
              <div className="absolute top-1/2 left-1/2 right-0 h-[2px] bg-slate-200 dark:bg-slate-200 -translate-y-1/2 z-0 pointer-events-none" />
            )}

            {/* Symmetrical Central Content */}
            <div className="z-10 flex flex-col items-center gap-4 bg-slate-900 border border-slate-800 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md max-w-[140px] text-center">
              {/* Champion Banner above Trophy if resolved */}
              {champion && (
                <div className="flex flex-col items-center animate-bounce-subtle">
                  <span className="text-[9px] font-black text-yellow-500 tracking-widest uppercase mb-0.5">
                    🏆 CAMPEÓN
                  </span>
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/40 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full font-black text-[10px] shadow-xs">
                    <Flag code={getCountryIsoCode(champion.name)} className="w-3.5 h-2.5 rounded-xs object-cover" />
                    <span className="truncate max-w-[70px]">{champion.name}</span>
                  </div>
                </div>
              )}

              {/* Premium Trophy Graphic or Champion Flag */}
              <div className={clsx(
                "relative flex items-center justify-center transition-all duration-500 rounded-full border shadow-inner select-none",
                champion 
                  ? "w-20 h-20 border-yellow-400 dark:border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-110 bg-white dark:bg-slate-900 p-0.5 overflow-hidden" 
                  : "w-14 h-14 bg-slate-800 border-slate-700 text-slate-500 p-3"
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
                  <Trophy className="w-8 h-8" />
                )}
              </div>
            </div>

            {/* Admin Floating Buttons stacked vertically */}
            {isAdmin && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-20 animate-fade-in">
                <button
                  onClick={simulateAll}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 hover:scale-102 cursor-pointer w-24"
                  title="Simular todo el torneo"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simular</span>
                </button>
                <button
                  onClick={resetTournament}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 hover:scale-102 cursor-pointer w-24"
                  title="Limpiar todos los resultados"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              </div>
            )}
          </div>


          {/* --- RIGHT SIDE BRACKET --- */}

          {/* Right Col 9: Finalist Circle */}
          <div className="flex items-center justify-center" style={{ gridColumn: 11, gridRow: "1 / span 16" }}>
            {renderTeamCircle(finalMatch?.awayTeam, finalMatch, "Final")}
          </div>

          {/* Right Col 8: SF-Finalist Connector */}
          {rightSFIds.map((id, index) => {
            const sfMatch = getMatch(id);
            const highlightTop = isSameTeam(sfMatch?.winner, sfMatch?.homeTeam);
            const highlightBottom = isSameTeam(sfMatch?.winner, sfMatch?.awayTeam);
            const highlightOutput = !isPlaceholderTeam(sfMatch?.winner);

            return (
              <RightConnector
                key={`r-conn-sf-${id}`}
                rowSpan={16}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 12, gridRowStart: 1 }}
              />
            );
          })}

          {/* Right Col 7: SF Circles */}
          {rightSFIds.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`r-sf-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 13, gridRow: `${index * 16 + 1} / span 8` }}>
                  {renderTeamCircle(m?.homeTeam, m, "Semifinal")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 13, gridRow: `${index * 16 + 9} / span 8` }}>
                  {renderTeamCircle(m?.awayTeam, m, "Semifinal")}
                </div>
              </React.Fragment>
            );
          })}

          {/* Right Col 6: QF-SF Connectors */}
          {rightQFIds.map((id, index) => {
            const qfMatch = getMatch(id);
            const sfMatch = getMatch(rightSFIds[Math.floor(index / 2)]);

            const highlightTop = isSameTeam(qfMatch?.winner, qfMatch?.homeTeam);
            const highlightBottom = isSameTeam(qfMatch?.winner, qfMatch?.awayTeam);
            const highlightOutput = !isPlaceholderTeam(qfMatch?.winner);

            return (
              <RightConnector
                key={`r-conn-qf-${id}`}
                rowSpan={8}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 14, gridRowStart: index * 8 + 1 }}
              />
            );
          })}

          {/* Right Col 5: QF Circles */}
          {rightQFIds.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`r-qf-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 15, gridRow: `${index * 8 + 1} / span 4` }}>
                  {renderTeamCircle(m?.homeTeam, m, "Cuartos")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 15, gridRow: `${index * 8 + 5} / span 4` }}>
                  {renderTeamCircle(m?.awayTeam, m, "Cuartos")}
                </div>
              </React.Fragment>
            );
          })}

          {/* Right Col 4: R16-QF Connectors */}
          {rightR16Ids.map((id, index) => {
            const r16Match = getMatch(id);
            const qfMatch = getMatch(rightQFIds[Math.floor(index / 2)]);

            const highlightTop = isSameTeam(r16Match?.winner, r16Match?.homeTeam);
            const highlightBottom = isSameTeam(r16Match?.winner, r16Match?.awayTeam);
            const highlightOutput = !isPlaceholderTeam(r16Match?.winner);

            return (
              <RightConnector
                key={`r-conn-r16-${id}`}
                rowSpan={4}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 16, gridRowStart: index * 4 + 1 }}
              />
            );
          })}

          {/* Right Col 3: R16 Circles */}
          {rightR16Ids.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`r-r16-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 17, gridRow: `${index * 4 + 1} / span 2` }}>
                  {renderTeamCircle(m?.homeTeam, m, "Octavos")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 17, gridRow: `${index * 4 + 3} / span 2` }}>
                  {renderTeamCircle(m?.awayTeam, m, "Octavos")}
                </div>
              </React.Fragment>
            );
          })}

          {/* Right Col 2: R32-R16 Connectors */}
          {rightR32Ids.map((id, index) => {
            const r32Match = getMatch(id);
            const r16Match = getMatch(rightR16Ids[Math.floor(index / 2)]);

            const highlightTop = isSameTeam(r32Match?.winner, r32Match?.homeTeam);
            const highlightBottom = isSameTeam(r32Match?.winner, r32Match?.awayTeam);
            const highlightOutput = !isPlaceholderTeam(r32Match?.winner);

            return (
              <RightConnector
                key={`r-conn-r32-${id}`}
                rowSpan={2}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightOutput={highlightOutput}
                style={{ gridColumn: 18, gridRowStart: index * 2 + 1 }}
              />
            );
          })}

          {/* Right Col 1: R32 Circles */}
          {rightR32Ids.map((id, index) => {
            const m = getMatch(id);
            return (
              <React.Fragment key={`r-r32-${id}`}>
                <div className="flex items-center justify-center" style={{ gridColumn: 19, gridRowStart: index * 2 + 1 }}>
                  {renderTeamCircle(m?.homeTeam, m, "16avos")}
                </div>
                <div className="flex items-center justify-center" style={{ gridColumn: 19, gridRowStart: index * 2 + 2 }}>
                  {renderTeamCircle(m?.awayTeam, m, "16avos")}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
