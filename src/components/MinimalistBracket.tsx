"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal, flushSync } from "react-dom";
import { motion } from "framer-motion";
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
import dynamic from "next/dynamic";

const TrophyCanvas = dynamic(() => import("@/components/TrophyCanvas"), {
  ssr: false,
});

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
  renderTeamCircle: (
    team: any,
    match: KnockoutMatch | undefined,
    roundName: string,
    type?: "home" | "away" | "winner",
    customSize?: string
  ) => React.ReactNode;
  hoveredTeamNames?: string[] | null;
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
  hoveredTeamNames,
}: ConnectorProps) {
  const strokeNonLit = "rgba(30, 41, 59, 0.85)";
  const strokeLit = "rgba(226, 232, 240, 0.85)";
  const widthNonLit = 1.5;
  const widthLit = 1.5;

  const isHovered = (t: any) => {
    if (!hoveredTeamNames || hoveredTeamNames.length === 0 || !t || "placeholder" in t) return false;
    return hoveredTeamNames.includes(t.name);
  };

  const getPathStyle = (isPathForTeam: boolean, defaultLit: boolean) => {
    if (hoveredTeamNames) {
      if (isPathForTeam) {
        return {
          stroke: "rgba(96, 165, 250, 1)",
          strokeWidth: 2.5,
        };
      } else {
        return {
          stroke: "rgba(30, 41, 59, 0.15)",
          strokeWidth: 1.0,
        };
      }
    }
    return {
      stroke: defaultLit ? strokeLit : strokeNonLit,
      strokeWidth: defaultLit ? widthLit : widthNonLit,
    };
  };

  const topStyle = getPathStyle(isHovered(match?.homeTeam) && isHovered(match?.winner), !!highlightTop);
  const bottomStyle = getPathStyle(isHovered(match?.awayTeam) && isHovered(match?.winner), !!highlightBottom);
  const outputStyle = getPathStyle(isHovered(match?.winner), !!highlightOutput);

  return (
    <div
      className="relative w-full h-full pointer-events-none"
      style={{ ...style, gridRow: `${style?.gridRowStart} / span ${rowSpan}` }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        {/* Draw top branch */}
        <path
          d="M 0 25 L 50 25 L 50 50"
          fill="none"
          stroke={topStyle.stroke}
          strokeWidth={topStyle.strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
          style={match ? { viewTransitionName: `path-${match.id}-top` } as any : undefined}
        />

        {/* Draw bottom branch */}
        <path
          d="M 0 75 L 50 75 L 50 50"
          fill="none"
          stroke={bottomStyle.stroke}
          strokeWidth={bottomStyle.strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
          style={match ? { viewTransitionName: `path-${match.id}-bottom` } as any : undefined}
        />

        {/* Draw output branch */}
        <path
          d="M 50 50 L 100 50"
          fill="none"
          stroke={outputStyle.stroke}
          strokeWidth={outputStyle.strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Junction dot */}
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300",
          hoveredTeamNames
            ? isHovered(match?.winner)
              ? "w-[6px] h-[6px] bg-blue-400 border-[0.5px] border-blue-900 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
              : "w-[4px] h-[4px] bg-slate-800 opacity-20"
            : highlightOutput
              ? "w-[5px] h-[5px] bg-slate-200 border-[0.5px] border-slate-900 shadow-sm"
              : "w-[4px] h-[4px] bg-slate-700"
        )}
        style={match ? { viewTransitionName: `dot-${match.id}` } as any : undefined}
      />

      {/* Winner flag at the end of the output branch (centered at the right edge of this column) */}
      {match !== undefined && (
        <div className="absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          {renderTeamCircle(
            team,
            match,
            roundName || "",
            "winner"
          )}
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
  hoveredTeamNames,
}: ConnectorProps) {
  const strokeNonLit = "rgba(30, 41, 59, 0.85)";
  const strokeLit = "rgba(226, 232, 240, 0.85)";
  const widthNonLit = 1.5;
  const widthLit = 1.5;

  const isHovered = (t: any) => {
    if (!hoveredTeamNames || hoveredTeamNames.length === 0 || !t || "placeholder" in t) return false;
    return hoveredTeamNames.includes(t.name);
  };

  const getPathStyle = (isPathForTeam: boolean, defaultLit: boolean) => {
    if (hoveredTeamNames) {
      if (isPathForTeam) {
        return {
          stroke: "rgba(96, 165, 250, 1)",
          strokeWidth: 2.5,
        };
      } else {
        return {
          stroke: "rgba(30, 41, 59, 0.15)",
          strokeWidth: 1.0,
        };
      }
    }
    return {
      stroke: defaultLit ? strokeLit : strokeNonLit,
      strokeWidth: defaultLit ? widthLit : widthNonLit,
    };
  };

  const topStyle = getPathStyle(isHovered(match?.homeTeam) && isHovered(match?.winner), !!highlightTop);
  const bottomStyle = getPathStyle(isHovered(match?.awayTeam) && isHovered(match?.winner), !!highlightBottom);
  const outputStyle = getPathStyle(isHovered(match?.winner), !!highlightOutput);

  return (
    <div
      className="relative w-full h-full pointer-events-none"
      style={{ ...style, gridRow: `${style?.gridRowStart} / span ${rowSpan}` }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        {/* Draw top branch */}
        <path
          d="M 100 25 L 50 25 L 50 50"
          fill="none"
          stroke={topStyle.stroke}
          strokeWidth={topStyle.strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
          style={match ? { viewTransitionName: `path-${match.id}-top` } as any : undefined}
        />

        {/* Draw bottom branch */}
        <path
          d="M 100 75 L 50 75 L 50 50"
          fill="none"
          stroke={bottomStyle.stroke}
          strokeWidth={bottomStyle.strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
          style={match ? { viewTransitionName: `path-${match.id}-bottom` } as any : undefined}
        />

        {/* Draw output branch */}
        <path
          d="M 50 50 L 0 50"
          fill="none"
          stroke={outputStyle.stroke}
          strokeWidth={outputStyle.strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Junction dot */}
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300",
          hoveredTeamNames
            ? isHovered(match?.winner)
              ? "w-[6px] h-[6px] bg-blue-400 border-[0.5px] border-blue-900 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
              : "w-[4px] h-[4px] bg-slate-800 opacity-20"
            : highlightOutput
              ? "w-[5px] h-[5px] bg-slate-200 border-[0.5px] border-slate-900 shadow-sm"
              : "w-[4px] h-[4px] bg-slate-700"
        )}
        style={match ? { viewTransitionName: `dot-${match.id}` } as any : undefined}
      />

      {/* Winner flag at the end of the output branch (centered at the left edge of this column) */}
      {match !== undefined && (
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          {renderTeamCircle(
            team,
            match,
            roundName || "",
            "winner"
          )}
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
  const [hoveredTeamNames, setHoveredTeamNames] = useState<string[] | null>(null);
  const [hoveredMatchKey, setHoveredMatchKey] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("bracket_view_mode") as "linear" | "circular";
    if (savedMode === "linear" || savedMode === "circular") {
      setViewMode(savedMode);
    }
  }, []);

  const handleSetViewMode = (mode: "linear" | "circular") => {
    const doc = document as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        flushSync(() => {
          setViewMode(mode);
        });
        localStorage.setItem("bracket_view_mode", mode);
      });
    } else {
      setViewMode(mode);
      localStorage.setItem("bracket_view_mode", mode);
    }
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

  const isTeamInHovered = (team: any) => {
    if (!hoveredTeamNames || hoveredTeamNames.length === 0 || !team || "placeholder" in team) return false;
    return hoveredTeamNames.includes(team.name);
  };

  // Render a team circle (flag or placeholder)
  const renderTeamCircle = (
    team: any,
    match: KnockoutMatch | undefined,
    roundName: string,
    type?: "home" | "away" | "winner",
    customSize?: string
  ) => {
    const isPH = isPlaceholderTeam(team);
    const name = getTeamName(team, match);

    const candidates = match ? (
      type === "winner"
        ? match.probabilisticData?.winnerCandidates
        : (type === "home" ? match.probabilisticData?.homeCandidates : match.probabilisticData?.awayCandidates)
    ) : undefined;
    const hasCandidates = candidates && candidates.length > 0;

    const matchKey = match && type ? `${match.id}-${type}` : null;
    const isSelfHovered = matchKey && hoveredMatchKey === matchKey;
    const isHoveredTeam = team && !isPH && hoveredTeamNames && hoveredTeamNames.includes(team.name);
    const isAnyHovered = hoveredTeamNames !== null;

    const handleMouseEnter = () => {
      setHoveredMatchKey(matchKey);
      if (!isPH && team && team.name) {
        setHoveredTeamNames([team.name]);
      } else if (isPH && hasCandidates && candidates) {
        setHoveredTeamNames(candidates.map((c) => c.team.name));
      }
    };

    const handleMouseLeave = () => {
      setHoveredMatchKey(null);
      setHoveredTeamNames(null);
    };

    const vtName = match && type ? `flag-${match.id}-${type}` : undefined;

    const circleContent = (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-winning-path-flag={(!isPH && isHoveredTeam) ? "true" : undefined}
        className={clsx(
          customSize || "w-6 h-6 md:w-8 md:h-8",
          "rounded-full flex items-center justify-center shadow-md select-none transition-all duration-300 border cursor-pointer",
          isPH
            ? "bg-slate-100 dark:bg-slate-800 border-slate-700 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[8px] md:text-[10px] font-black"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-200",
          !isPH && "hover:scale-115 hover:shadow-lg",
          isAnyHovered && (
            (isHoveredTeam || isSelfHovered)
              ? "scale-115 ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] z-30"
              : "opacity-20"
          ),
          isAnyHovered && isPH && !isSelfHovered && "opacity-20"
        )}
        style={{
          viewTransitionName: vtName,
        } as any}
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
      if (hasCandidates) {
        return (
          <Tooltip
            content={<CandidatesTooltip candidates={candidates} />}
            placement="top"
            interactive={false}
            autoAdjustPlacement={true}
            wrapperClassName={clsx("flex items-center justify-center z-20", customSize || "w-6 h-6 md:w-8 md:h-8")}
          >
            {circleContent}
          </Tooltip>
        );
      }

      return (
        <div className="flex items-center justify-center w-full h-full relative z-20">
          <div className={clsx("flex items-center justify-center", customSize || "w-6 h-6 md:w-8 md:h-8")}>
            {circleContent}
          </div>
        </div>
      );
    }

    return (
      <Tooltip
        content={<span className="font-bold text-xs">{name}</span>}
        placement="top"
        interactive={false}
        autoAdjustPlacement={true}
        wrapperClassName={clsx("flex items-center justify-center z-20", customSize || "w-6 h-6 md:w-8 md:h-8")}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 border border-slate-800/80 rounded-3xl p-6 relative w-full max-w-[1400px] h-full max-h-[92vh] md:max-h-[850px] flex flex-col justify-between shadow-2xl backdrop-blur-xl"
      >

        {/* View Mode Toggle — centered on mobile, top-left on desktop */}
        <button
          onClick={() => handleSetViewMode(viewMode === "linear" ? "circular" : "linear")}
          className="absolute top-4 left-1/2 -translate-x-1/2 min-[1200px]:left-4 min-[1200px]:translate-x-0 z-30 flex items-center bg-slate-800/80 border border-slate-700/50 p-0.5 rounded-full backdrop-blur-md shadow-md cursor-pointer select-none w-32 h-[26px] relative group"
          title="Cambiar vista (Lineal / Circular)"
        >
          {/* Sliding indicator */}
          <div
            className={clsx(
              "absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-blue-600 shadow-sm transition-transform duration-200 ease-out",
              viewMode === "circular" ? "translate-x-full" : "translate-x-0"
            )}
          />
          <span
            className={clsx(
              "w-1/2 text-center text-[10px] font-bold z-10 transition-colors duration-200",
              viewMode === "linear" ? "text-white" : "text-slate-400 group-hover:text-slate-200"
            )}
          >
            Lineal
          </span>
          <span
            className={clsx(
              "w-1/2 text-center text-[10px] font-bold z-10 transition-colors duration-200",
              viewMode === "circular" ? "text-white" : "text-slate-400 group-hover:text-slate-200"
            )}
          >
            Circular
          </span>
        </button>

        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors cursor-pointer border border-slate-700/40"
          title="Cerrar modal (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Persistent 3D World Cup Trophy to avoid unmounting during view transitions */}
        <div
          className={clsx(
            "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-32 md:w-32 md:h-36 z-20 pointer-events-none select-none flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out",
            champion ? "top-[calc(50%+115px)]" : "top-[calc(50%+85px)]"
          )}
        >
          <TrophyCanvas targetHeight={3.5} cameraPosition={[0, 0, 7.5]} interactive={false} />
        </div>

        {/* Conditional Content: Linear Grid or Circular Bracket */}
        {viewMode === "linear" ? (
          <div className="absolute inset-6 flex items-center justify-center overflow-hidden">
            <div
              className="grid gap-y-0 w-full max-w-[800px] items-stretch justify-items-stretch grid-cols-[24px_1.0fr_1.1fr_1.2fr_1.3fr_2.2fr_1.3fr_1.2fr_1.1fr_1.0fr_24px] md:grid-cols-[32px_1.2fr_1.4fr_1.6fr_1.8fr_3.5fr_1.8fr_1.6fr_1.4fr_1.2fr_32px]"
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
                const highlightOutput = highlightTop || highlightBottom;                return (
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
                    hoveredTeamNames={hoveredTeamNames}
                  />
                );
              })}

              {/* Left Col 3: R16-QF Connectors */}
              {leftR16Ids.map((id, index) => {
                const r16Match = getMatch(id);
                const qfMatch = getMatch(leftQFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(r16Match?.winner, r16Match?.homeTeam);
                const highlightBottom = isSameTeam(r16Match?.winner, r16Match?.awayTeam);
                const highlightOutput = highlightTop || highlightBottom;

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
                    hoveredTeamNames={hoveredTeamNames}
                  />
                );
              })}

              {/* Left Col 4: QF-SF Connectors */}
              {leftQFIds.map((id, index) => {
                const qfMatch = getMatch(id);
                const sfMatch = getMatch(leftSFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(qfMatch?.winner, qfMatch?.homeTeam);
                const highlightBottom = isSameTeam(qfMatch?.winner, qfMatch?.awayTeam);
                const highlightOutput = highlightTop || highlightBottom;

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
                    hoveredTeamNames={hoveredTeamNames}
                  />
                );
              })}

              {/* Left Col 5: SF-Finalist Connector */}
              {leftSFIds.map((id, index) => {
                const sfMatch = getMatch(id);
                const finalMatch = getMatch(finalMatchId);
                const highlightTop = isSameTeam(sfMatch?.winner, sfMatch?.homeTeam);
                const highlightBottom = isSameTeam(sfMatch?.winner, sfMatch?.awayTeam);
                const highlightOutput = highlightTop || highlightBottom;

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
                    hoveredTeamNames={hoveredTeamNames}
                  />
                );
              })}


              {/* --- CENTER ZONE (Final & Trophy) --- */}

              <div className="col-start-6 row-start-1 row-span-full relative flex flex-col items-center justify-start pt-16 md:justify-center md:pt-0">
                {/* Left side of center line */}
                <div
                  className={clsx(
                    "absolute top-1/2 left-0 right-1/2 -translate-y-1/2 z-0 pointer-events-none transition-all duration-300",
                    hoveredTeamNames
                      ? (isTeamInHovered(finalMatch?.homeTeam) && isTeamInHovered(champion))
                        ? "bg-blue-400 h-[2.5px]"
                        : "bg-[rgba(30,41,59,0.15)] h-[1px]"
                      : (finalMatch?.homeTeam && !isPlaceholderTeam(finalMatch.homeTeam) && isSameTeam(champion, finalMatch.homeTeam))
                        ? "bg-[rgba(226,232,240,0.85)] h-[1.5px]"
                        : "bg-[rgba(30,41,59,0.85)] h-[1.5px]"
                  )}
                />

                {/* Right side of center line */}
                <div
                  className={clsx(
                    "absolute top-1/2 left-1/2 right-0 -translate-y-1/2 z-0 pointer-events-none transition-all duration-300",
                    hoveredTeamNames
                      ? (isTeamInHovered(finalMatch?.awayTeam) && isTeamInHovered(champion))
                        ? "bg-blue-400 h-[2.5px]"
                        : "bg-[rgba(30,41,59,0.15)] h-[1px]"
                      : (finalMatch?.awayTeam && !isPlaceholderTeam(finalMatch.awayTeam) && isSameTeam(champion, finalMatch.awayTeam))
                        ? "bg-[rgba(226,232,240,0.85)] h-[1.5px]"
                        : "bg-[rgba(30,41,59,0.85)] h-[1.5px]"
                  )}
                />

                {/* Symmetrical central vertical connector line for mobile */}
                <div
                  className={clsx(
                    "absolute top-[100px] bottom-1/2 left-1/2 -translate-x-1/2 z-0 pointer-events-none transition-all duration-300 md:hidden",
                    hoveredTeamNames
                      ? (champion && hoveredTeamNames.includes(champion.name))
                        ? "bg-blue-400 w-[2.5px]"
                        : "bg-[rgba(30,41,59,0.15)] w-[1px]"
                      : champion
                        ? "bg-yellow-500 w-[1.5px]"
                        : "bg-[rgba(30,41,59,0.85)] w-[1.5px]"
                  )}
                />

                {/* Center Glow behind Trophy/Champion */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 rounded-full pointer-events-none z-0"
                  style={{
                    background: "radial-gradient(circle, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0) 70%)"
                  }}
                />

                {/* Symmetrical Central Content */}
                <div className="z-10 flex flex-col items-center">
                  {/* Champion Banner above Trophy if resolved */}
                  {champion && (
                    <span
                      className={clsx(
                        "text-[7px] md:text-[9px] font-black text-yellow-500 tracking-widest uppercase mb-1.5 md:mb-3 animate-bounce-subtle transition-all duration-300",
                        hoveredTeamNames && !hoveredTeamNames.includes(champion.name) && hoveredMatchKey !== "champion" && "opacity-20"
                      )}
                      style={{ viewTransitionName: "label-champion" } as any}
                    >
                      🏆 CAMPEÓN
                    </span>
                  )}

                  {/* Premium Trophy Graphic or Champion Flag */}
                  <Tooltip
                    content={
                      champion ? (
                        <span className="font-bold text-xs">Campeón: {champion.name}</span>
                      ) : finalMatch?.probabilisticData?.winnerCandidates && finalMatch.probabilisticData.winnerCandidates.length > 0 ? (
                        <CandidatesTooltip candidates={finalMatch.probabilisticData.winnerCandidates} />
                      ) : (
                        <span className="font-bold text-xs">Campeón TBD</span>
                      )
                    }
                    placement="top"
                    interactive={false}
                    autoAdjustPlacement={true}
                    wrapperClassName="z-20"
                  >
                    <div
                      onMouseEnter={() => {
                        setHoveredMatchKey("champion");
                        if (champion) {
                          setHoveredTeamNames([champion.name]);
                        } else {
                          const finalCandidates = finalMatch?.probabilisticData?.winnerCandidates;
                          if (finalCandidates && finalCandidates.length > 0) {
                            setHoveredTeamNames(finalCandidates.map(c => c.team.name));
                          }
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredMatchKey(null);
                        setHoveredTeamNames(null);
                      }}
                      data-winning-path-flag={(champion && hoveredTeamNames && hoveredTeamNames.includes(champion.name)) ? "true" : undefined}
                      className={clsx(
                        "flex items-center justify-center rounded-full border shadow-xl transition-all duration-300 select-none cursor-pointer",
                        champion
                          ? "w-14 h-14 md:w-20 md:h-20 border-yellow-400 dark:border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)] bg-white dark:bg-slate-900 p-0.5 overflow-hidden"
                          : "w-10 h-10 md:w-14 md:h-14 bg-slate-800 border-slate-700 text-slate-500 p-2 md:p-3",
                        hoveredTeamNames && (
                          (champion && hoveredTeamNames.includes(champion.name)) || hoveredMatchKey === "champion"
                            ? "scale-110 ring-2 ring-yellow-400 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-pulse"
                            : "opacity-20"
                        )
                      )}
                      style={{
                        viewTransitionName: "flag-champion",
                      } as any}
                    >
                      {champion ? (() => {
                        const code = getCountryIsoCode(champion.name);
                        return (
                          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white aspect-square">
                            <Flag
                              code={code}
                              className="object-cover w-full h-full aspect-square rounded-full scale-105"
                              alt={champion.name}
                            />
                          </div>
                        );
                      })() : (
                        <Trophy className="w-6 h-6" />
                      )}
                    </div>
                  </Tooltip>

                  {/* Champion Name Chip below Trophy if resolved */}
                  {champion && (
                    <div
                      className={clsx(
                        "flex items-center gap-1 bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/40 text-yellow-800 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-black text-[8px] md:text-[10px] shadow-xs mt-1.5 transition-all duration-300",
                        hoveredTeamNames && !hoveredTeamNames.includes(champion.name) && hoveredMatchKey !== "champion" && "opacity-20"
                      )}
                      style={{ viewTransitionName: "name-champion" } as any}
                    >
                      <Flag
                        code={getCountryIsoCode(champion.name)}
                        className="w-2.5 h-2 md:w-3.5 md:h-2.5 rounded-xs object-cover"
                      />
                      <span className="truncate max-w-[60px] md:max-w-[70px]">{champion.name}</span>
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
                const highlightOutput = highlightTop || highlightBottom;

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
                    hoveredTeamNames={hoveredTeamNames}
                  />
                );
              })}

              {/* Right Col 4: QF-SF Connectors */}
              {rightQFIds.map((id, index) => {
                const qfMatch = getMatch(id);
                const sfMatch = getMatch(rightSFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(qfMatch?.winner, qfMatch?.homeTeam);
                const highlightBottom = isSameTeam(qfMatch?.winner, qfMatch?.awayTeam);
                const highlightOutput = highlightTop || highlightBottom;

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
                    hoveredTeamNames={hoveredTeamNames}
                  />
                );
              })}

              {/* Right Col 3: R16-QF Connectors */}
              {rightR16Ids.map((id, index) => {
                const r16Match = getMatch(id);
                const qfMatch = getMatch(rightQFIds[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(r16Match?.winner, r16Match?.homeTeam);
                const highlightBottom = isSameTeam(r16Match?.winner, r16Match?.awayTeam);
                const highlightOutput = highlightTop || highlightBottom;

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
                    hoveredTeamNames={hoveredTeamNames}
                  />
                );
              })}

              {/* Right Col 2: R32-R16 Connectors */}
              {rightR32Ids.map((id, index) => {
                const r32Match = getMatch(id);
                const r16Match = getMatch(rightR16Ids[Math.floor(index / 2)]);
                const highlightTop = isSameTeam(r32Match?.winner, r32Match?.homeTeam);
                const highlightBottom = isSameTeam(r32Match?.winner, r32Match?.awayTeam);
                const highlightOutput = highlightTop || highlightBottom;

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
                    hoveredTeamNames={hoveredTeamNames}
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
            hoveredTeamNames={hoveredTeamNames}
            setHoveredTeamNames={setHoveredTeamNames}
            hoveredMatchKey={hoveredMatchKey}
            setHoveredMatchKey={setHoveredMatchKey}
          />
        )}

        {/* Slow Motion Style to Verify Transitions */}
        <style dangerouslySetInnerHTML={{
          __html: `
          ::view-transition-group(*),
          ::view-transition-old(*),
          ::view-transition-new(*) {
            animation-duration: 0.25s !important;
          }
        `}} />

        {/* Unified Admin Floating Buttons — centered/horizontal on mobile, bottom-left/vertical on desktop */}
        {isAdmin && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 min-[1200px]:left-6 min-[1200px]:translate-x-0 flex flex-row min-[1200px]:flex-col gap-2 z-30 animate-fade-in">
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
      </motion.div>
    </motion.div>,
    document.body
  );
}
