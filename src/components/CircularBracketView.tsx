"use client";

import React, { useMemo } from "react";
import { KnockoutMatch } from "@/data/types";
import { Tooltip } from "@/components/ui/Tooltip";
import Flag from "react-world-flags";
import { getCountryIsoCode } from "@/utils/countries";
import { Trophy, Zap, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { CandidatesTooltip } from "./KnockoutStage";

// ─── SVG ViewBox Constants ───────────────────────────
const VB = 1000;
const CX = VB / 2;
const CY = VB / 2;

// Radii for each ring (center → outer)
const R_FINALISTS = 110;
const R_QF = 190;
const R_R16 = 280;
const R_R32W = 375;
const R_R32T = 475;

// Node diameters per ring
const S_CHAMPION = 68;
const S_FINALIST = 32;
const S_QF = 32;
const S_R16 = 32;
const S_R32W = 32;
const S_R32T = 32;

// Match IDs in bracket tree order (same as MinimalistBracket)
const LEFT_R32 = ["74", "77", "73", "75", "83", "84", "81", "82"];
const LEFT_R16 = ["89", "90", "93", "94"];
const LEFT_QF = ["97", "98"];
const LEFT_SF = ["101"];

const RIGHT_R32 = ["76", "78", "79", "80", "86", "88", "85", "87"];
const RIGHT_R16 = ["91", "92", "95", "96"];
const RIGHT_QF = ["99", "100"];
const RIGHT_SF = ["102"];

const FINAL_ID = "104";

// ─── Geometry Helpers ────────────────────────────────
function polar(angle: number, r: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

/** Average of two angles on the unit circle (handles wrap-around). */
function avgAngle(a: number, b: number) {
  return Math.atan2(
    (Math.sin(a) + Math.sin(b)) / 2,
    (Math.cos(a) + Math.cos(b)) / 2,
  );
}

function getPathDAndJunction(
  thetaStart: number,
  thetaEnd: number,
  rStart: number,
  rEnd: number,
  rArc: number,
) {
  const pStart = polar(thetaStart, rStart);
  const pArcStart = polar(thetaStart, rArc);
  const pArcEnd = polar(thetaEnd, rArc);
  const pEnd = polar(thetaEnd, rEnd);

  let diff = thetaEnd - thetaStart;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  const sweepFlag = diff >= 0 ? 1 : 0;

  const pathD = `M ${pStart.x} ${pStart.y} L ${pArcStart.x} ${pArcStart.y} A ${rArc} ${rArc} 0 0 ${sweepFlag} ${pArcEnd.x} ${pArcEnd.y} L ${pEnd.x} ${pEnd.y}`;

  return {
    pathD,
    jx: pArcEnd.x,
    jy: pArcEnd.y,
  };
}

// ─── Team Helpers ────────────────────────────────────
function isPlaceholder(team: any): boolean {
  return !team || "placeholder" in team;
}

function same(a: any, b: any): boolean {
  if (!a || !b) return false;
  if ("placeholder" in a || "placeholder" in b) return false;
  return a.name === b.name;
}

function teamName(team: any, match?: KnockoutMatch): string {
  if (!team) return match ? `W${match.id}` : "TBD";
  if ("placeholder" in team) return team.placeholder;
  return team.name;
}

// ─── Internal Types ──────────────────────────────────
interface Node {
  id: string;
  x: number;
  y: number;
  team: any;
  match?: KnockoutMatch;
  type: "home" | "away" | "winner";
  round: string;
  size: number;
}

interface Edge {
  id: string;
  pathD: string;
  jx: number | null;
  jy: number | null;
  lit: boolean;
  team?: any;
}

// ─── Component Props ─────────────────────────────────
interface CircularBracketViewProps {
  matches: KnockoutMatch[];
  isAdmin: boolean;
  simulateAll: () => void;
  resetTournament: () => void;
  hoveredTeamNames: string[] | null;
  setHoveredTeamNames: (names: string[] | null) => void;
  hoveredMatchKey: string | null;
  setHoveredMatchKey: (key: string | null) => void;
}

export function CircularBracketView({
  matches,
  isAdmin,
  simulateAll,
  resetTournament,
  hoveredTeamNames,
  setHoveredTeamNames,
  hoveredMatchKey,
  setHoveredMatchKey,
}: CircularBracketViewProps) {
  const isHovered = (t: any) => {
    if (!hoveredTeamNames || hoveredTeamNames.length === 0 || !t || "placeholder" in t) return false;
    return hoveredTeamNames.includes(t.name);
  };

  // ── Compute nodes + edges ──────────────────────────
  const { nodes, edges, champion } = useMemo(() => {
    const map = new Map<string, KnockoutMatch>(matches.map((m) => [m.id, m]));
    const gm = (id: string) => map.get(id);

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    const STEP = Math.PI / 16; // 16 team-slots per half (8 matches × 2 teams)

    /**
     * Build one half of the bracket (left or right).
     *   dir = +1  → clockwise  (right half)
     *   dir = -1  → counter-clockwise (left half)
     */
    const buildHalf = (
      dir: 1 | -1,
      r32Ids: string[],
      r16Ids: string[],
      qfIds: string[],
      sfIds: string[],
      tag: string,
    ) => {
      // ── Level 0: R32 Teams (16 per half) ─────────
      const A0: number[] = []; // angles
      r32Ids.forEach((mid, mi) => {
        const m = gm(mid);
        const ha = -Math.PI / 2 + dir * (mi * 2 + 0.5) * STEP;
        const aa = -Math.PI / 2 + dir * (mi * 2 + 1.5) * STEP;
        A0.push(ha, aa);

        const hp = polar(ha, R_R32T);
        const ap = polar(aa, R_R32T);
        allNodes.push({
          id: `${tag}-t-${mid}-h`,
          ...hp,
          team: m?.homeTeam,
          match: m,
          type: "home",
          round: "16avos",
          size: S_R32T,
        });
        allNodes.push({
          id: `${tag}-t-${mid}-a`,
          ...ap,
          team: m?.awayTeam,
          match: m,
          type: "away",
          round: "16avos",
          size: S_R32T,
        });
      });

      // ── Level 1: R32 Winners (8 per half) ────────
      const A1: number[] = [];
      r32Ids.forEach((mid, mi) => {
        const m = gm(mid);
        const a = avgAngle(A0[mi * 2], A0[mi * 2 + 1]);
        A1.push(a);
        const p = polar(a, R_R32W);

        allNodes.push({
          id: `${tag}-w32-${mid}`,
          ...p,
          team: m?.winner,
          match: m,
          type: "winner",
          round: "Octavos",
          size: S_R32W,
        });

        // edges: team → R32 winner
        const { pathD: pathDH, jx: jxH, jy: jyH } = getPathDAndJunction(A0[mi * 2], a, R_R32T, R_R32W, 425);
        const { pathD: pathDA, jx: jxA, jy: jyA } = getPathDAndJunction(A0[mi * 2 + 1], a, R_R32T, R_R32W, 425);

        allEdges.push({
          id: `${tag}-e0-${mid}-h`,
          pathD: pathDH,
          jx: jxH,
          jy: jyH,
          lit: !!(m?.winner && same(m.homeTeam, m.winner)),
          team: m?.winner && same(m.homeTeam, m.winner) ? m.winner : undefined,
        });
        allEdges.push({
          id: `${tag}-e0-${mid}-a`,
          pathD: pathDA,
          jx: jxA,
          jy: jyA,
          lit: !!(m?.winner && same(m.awayTeam, m.winner)),
          team: m?.winner && same(m.awayTeam, m.winner) ? m.winner : undefined,
        });
      });

      // ── Level 2: R16 Winners (4 per half) ────────
      const A2: number[] = [];
      r16Ids.forEach((mid, i) => {
        const m = gm(mid);
        const a = avgAngle(A1[i * 2], A1[i * 2 + 1]);
        A2.push(a);
        const p = polar(a, R_R16);

        allNodes.push({
          id: `${tag}-w16-${mid}`,
          ...p,
          team: m?.winner,
          match: m,
          type: "winner",
          round: "Cuartos",
          size: S_R16,
        });

        const c1 = gm(r32Ids[i * 2]);
        const c2 = gm(r32Ids[i * 2 + 1]);
        const { pathD: pathD1, jx: jx1, jy: jy1 } = getPathDAndJunction(A1[i * 2], a, R_R32W, R_R16, 325);
        const { pathD: pathD2, jx: jx2, jy: jy2 } = getPathDAndJunction(A1[i * 2 + 1], a, R_R32W, R_R16, 325);

        allEdges.push({
          id: `${tag}-e1-${mid}-1`,
          pathD: pathD1,
          jx: jx1,
          jy: jy1,
          lit: !!(c1?.winner && m?.winner && same(c1.winner, m.winner)),
          team: c1?.winner && m?.winner && same(c1.winner, m.winner) ? m.winner : undefined,
        });
        allEdges.push({
          id: `${tag}-e1-${mid}-2`,
          pathD: pathD2,
          jx: jx2,
          jy: jy2,
          lit: !!(c2?.winner && m?.winner && same(c2.winner, m.winner)),
          team: c2?.winner && m?.winner && same(c2.winner, m.winner) ? m.winner : undefined,
        });
      });

      // ── Level 3: QF Winners (2 per half) ─────────
      const A3: number[] = [];
      qfIds.forEach((mid, i) => {
        const m = gm(mid);
        const a = avgAngle(A2[i * 2], A2[i * 2 + 1]);
        A3.push(a);
        const p = polar(a, R_QF);

        allNodes.push({
          id: `${tag}-wqf-${mid}`,
          ...p,
          team: m?.winner,
          match: m,
          type: "winner",
          round: "Semifinal",
          size: S_QF,
        });

        const c1 = gm(r16Ids[i * 2]);
        const c2 = gm(r16Ids[i * 2 + 1]);
        const { pathD: pathD1, jx: jx1, jy: jy1 } = getPathDAndJunction(A2[i * 2], a, R_R16, R_QF, 235);
        const { pathD: pathD2, jx: jx2, jy: jy2 } = getPathDAndJunction(A2[i * 2 + 1], a, R_R16, R_QF, 235);

        allEdges.push({
          id: `${tag}-e2-${mid}-1`,
          pathD: pathD1,
          jx: jx1,
          jy: jy1,
          lit: !!(c1?.winner && m?.winner && same(c1.winner, m.winner)),
          team: c1?.winner && m?.winner && same(c1.winner, m.winner) ? m.winner : undefined,
        });
        allEdges.push({
          id: `${tag}-e2-${mid}-2`,
          pathD: pathD2,
          jx: jx2,
          jy: jy2,
          lit: !!(c2?.winner && m?.winner && same(c2.winner, m.winner)),
          team: c2?.winner && m?.winner && same(c2.winner, m.winner) ? m.winner : undefined,
        });
      });

      // ── Level 4: SF Winner / Finalist (1 per half)
      sfIds.forEach((mid) => {
        const m = gm(mid);
        const a = avgAngle(A3[0], A3[1]);
        const p = polar(a, R_FINALISTS);

        allNodes.push({
          id: `${tag}-wsf-${mid}`,
          ...p,
          team: m?.winner,
          match: m,
          type: "winner",
          round: "Final",
          size: S_FINALIST,
        });

        // edges: QF winners → SF winner
        const c1 = gm(qfIds[0]);
        const c2 = gm(qfIds[1]);
        const { pathD: pathD1, jx: jx1, jy: jy1 } = getPathDAndJunction(A3[0], a, R_QF, R_FINALISTS, 150);
        const { pathD: pathD2, jx: jx2, jy: jy2 } = getPathDAndJunction(A3[1], a, R_QF, R_FINALISTS, 150);

        allEdges.push({
          id: `${tag}-e3-${mid}-1`,
          pathD: pathD1,
          jx: jx1,
          jy: jy1,
          lit: !!(c1?.winner && m?.winner && same(c1.winner, m.winner)),
          team: c1?.winner && m?.winner && same(c1.winner, m.winner) ? m.winner : undefined,
        });
        allEdges.push({
          id: `${tag}-e3-${mid}-2`,
          pathD: pathD2,
          jx: jx2,
          jy: jy2,
          lit: !!(c2?.winner && m?.winner && same(c2.winner, m.winner)),
          team: c2?.winner && m?.winner && same(c2.winner, m.winner) ? m.winner : undefined,
        });

        // edge: SF winner → center (champion)
        const fm = gm(FINAL_ID);
        allEdges.push({
          id: `${tag}-e4-${mid}`,
          pathD: `M ${p.x} ${p.y} L ${CX} ${CY}`,
          jx: null,
          jy: null,
          lit: !!(m?.winner && fm?.winner && same(m.winner, fm.winner)),
          team: m?.winner && fm?.winner && same(m.winner, fm.winner) ? fm.winner : undefined,
        });
      });
    };

    buildHalf(1, RIGHT_R32, RIGHT_R16, RIGHT_QF, RIGHT_SF, "R");
    buildHalf(-1, LEFT_R32, LEFT_R16, LEFT_QF, LEFT_SF, "L");

    const fm = gm(FINAL_ID);
    return { nodes: allNodes, edges: allEdges, champion: fm?.winner };
  }, [matches]);

  // ── Render a single team node ──────────────────────
  const renderNode = (node: Node) => {
    const isPH = isPlaceholder(node.team);
    const name = teamName(node.team, node.match);

    const candidates = node.match
      ? node.type === "winner"
        ? node.match.probabilisticData?.winnerCandidates
        : node.type === "home"
          ? node.match.probabilisticData?.homeCandidates
          : node.type === "away"
            ? node.match.probabilisticData?.awayCandidates
            : undefined
      : undefined;
    const hasCandidates = candidates && candidates.length > 0;

    const matchKey = node.match ? `${node.match.id}-${node.type}` : null;
    const isSelfHovered = matchKey && hoveredMatchKey === matchKey;
    const isHoveredTeam = node.team && !isPH && hoveredTeamNames && hoveredTeamNames.includes(node.team.name);
    const isAnyHovered = hoveredTeamNames !== null;

    const handleMouseEnter = () => {
      setHoveredMatchKey(matchKey);
      if (!isPH && node.team && node.team.name) {
        setHoveredTeamNames([node.team.name]);
      } else if (isPH && hasCandidates && candidates) {
        setHoveredTeamNames(candidates.map((c) => c.team.name));
      }
    };

    const handleMouseLeave = () => {
      setHoveredMatchKey(null);
      setHoveredTeamNames(null);
    };

    const vtName = node.match ? `flag-${node.match.id}-${node.type}` : undefined;

    const circle = (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={clsx(
          "rounded-full flex items-center justify-center shadow-md select-none transition-all duration-300 border cursor-pointer",
          isPH
            ? "bg-slate-800 border-slate-700 text-slate-500"
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
          width: node.size,
          height: node.size,
          viewTransitionName: vtName,
        } as any}
      >
        {isPH
          ? null
          : (() => {
            const code = getCountryIsoCode(name);
            if (!code)
              return (
                <div className="w-full h-full bg-slate-700 rounded-full" />
              );
            return (
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white aspect-square">
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
      if (hasCandidates && candidates) {
        return (
          <Tooltip
            content={<CandidatesTooltip candidates={candidates} />}
            placement="top"
            interactive={false}
          >
            {circle}
          </Tooltip>
        );
      }
      return circle;
    }

    return (
      <Tooltip
        content={<span className="font-bold text-xs">{name}</span>}
        placement="top"
        interactive={false}
      >
        {circle}
      </Tooltip>
    );
  };

  // ── Render ─────────────────────────────────────────
  const squareSize = "min(calc(92vh - 56px), calc(100vw - 56px), 800px)";

  return (
    <div className="absolute inset-6 flex items-center justify-center overflow-hidden">
      <div
        className="relative"
        style={{
          width: squareSize,
          height: squareSize,
        }}
      >
        {/* SVG Layer: ring guides + connector lines */}
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Connector edges — non-highlighted first, highlighted on top */}
          {edges
            .filter((e) => {
              if (hoveredTeamNames) {
                return !isHovered(e.team);
              }
              return !e.lit;
            })
            .map((e) => {
              const mid = e.id.split("-")[2];
              const isTop = e.id.endsWith("-h") || e.id.endsWith("-1");
              const vtName = `path-${mid}-${isTop ? "top" : "bottom"}`;
              return (
                <path
                  key={e.id}
                  d={e.pathD}
                  fill="none"
                  stroke={hoveredTeamNames ? "rgba(30,41,59,0.15)" : "rgba(30,41,59,0.85)"}
                  strokeWidth={hoveredTeamNames ? 1.0 : 1.5}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                  style={{ viewTransitionName: vtName } as any}
                />
              );
            })}
          {edges
            .filter((e) => {
              if (hoveredTeamNames) {
                return isHovered(e.team);
              }
              return e.lit;
            })
            .map((e) => {
              const mid = e.id.split("-")[2];
              const isTop = e.id.endsWith("-h") || e.id.endsWith("-1");
              const vtName = `path-${mid}-${isTop ? "top" : "bottom"}`;
              return (
                <path
                  key={e.id}
                  d={e.pathD}
                  fill="none"
                  stroke={hoveredTeamNames ? "rgba(96, 165, 250, 1)" : "rgba(226, 232, 240, 0.85)"}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                  style={{ viewTransitionName: vtName } as any}
                />
              );
            })}
        </svg>

        {/* HTML Layer: junction dots */}
        {edges
          .filter((e) => e.jx !== null && e.jy !== null)
          .map((e) => {
            const mid = e.id.split("-")[2];
            const isFirstEdge = e.id.endsWith("-h") || e.id.endsWith("-1");
            if (!isFirstEdge) return null;
            const vtName = `dot-${mid}`;

            // Check if this match contains any lit/hovered edge
            const isMatchHovered = hoveredTeamNames && edges.some((edge) => edge.id.split("-")[2] === mid && isHovered(edge.team));
            const isMatchLit = !hoveredTeamNames && edges.some((edge) => edge.id.split("-")[2] === mid && edge.lit);

            return (
              <div
                key={`dot-html-${e.id}`}
                className={clsx(
                  "absolute rounded-full transition-all duration-300 pointer-events-none z-10",
                  hoveredTeamNames
                    ? isMatchHovered
                      ? "w-[6px] h-[6px] bg-blue-400 border-[0.5px] border-blue-900 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                      : "w-[4px] h-[4px] bg-slate-800 opacity-20"
                    : isMatchLit
                      ? "w-[5px] h-[5px] bg-slate-200 border-[0.5px] border-slate-900 shadow-sm"
                      : "w-[4px] h-[4px] bg-slate-700"
                )}
                style={{
                  left: `${(e.jx! / VB) * 100}%`,
                  top: `${(e.jy! / VB) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  viewTransitionName: vtName,
                } as any}
              />
            );
          })}

        {/* HTML Layer: team circle nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute z-10"
            style={{
              left: `${(node.x / VB) * 100}%`,
              top: `${(node.y / VB) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {renderNode(node)}
          </div>
        ))}

        {/* Center Glow behind Trophy/Champion */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0) 70%)"
          }}
        />

        {/* Center: Trophy / Champion */}
        <div
          className="absolute z-20"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex flex-col items-center">
            {/* Champion label */}
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

            {/* Trophy / Flag circle */}
            <div
              onMouseEnter={() => {
                setHoveredMatchKey("champion");
                if (champion) {
                  setHoveredTeamNames([champion.name]);
                } else {
                  const finalMatch = matches.find((m) => m.id === FINAL_ID);
                  const finalCandidates = finalMatch?.probabilisticData?.winnerCandidates;
                  if (finalCandidates && finalCandidates.length > 0) {
                    setHoveredTeamNames(finalCandidates.map((c) => c.team.name));
                  }
                }
              }}
              onMouseLeave={() => {
                setHoveredMatchKey(null);
                setHoveredTeamNames(null);
              }}
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
              {champion ? (
                (() => {
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
                })()
              ) : (
                <Trophy className="w-6 h-6" />
              )}
            </div>

            {/* Champion name chip */}
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

      </div>


    </div>
  );
}
