"use client";

import { useState } from "react";
import { GroupStage } from "@/components/GroupStage";
import { KnockoutStage } from "@/components/KnockoutStage";
import { INITIAL_GROUPS } from "@/data/initialData";
import { clsx } from "clsx";
import { Group, Team } from "@/data/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"groups" | "knockout">("groups");
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);

  const recalculateGroupStats = (group: Group): Group => {
    // Reset stats for all teams
    const newTeams = group.teams.map((team) => ({
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      pts: 0,
    }));

    // Map for easy access
    const teamMap = new Map<string, Team>();
    newTeams.forEach((t) => teamMap.set(t.id, t));

    // Process matches
    group.matches.forEach((match) => {
      if (
        match.homeScore !== undefined &&
        match.homeScore !== null &&
        match.awayScore !== undefined &&
        match.awayScore !== null
      ) {
        const homeTeam = teamMap.get(match.homeTeamId);
        const awayTeam = teamMap.get(match.awayTeamId);

        if (homeTeam && awayTeam) {
          // Update Played
          homeTeam.played += 1;
          awayTeam.played += 1;

          // Update Goals
          homeTeam.gf += match.homeScore;
          homeTeam.ga += match.awayScore;
          awayTeam.gf += match.awayScore;
          awayTeam.ga += match.homeScore;

          // Update W/D/L and Points
          if (match.homeScore > match.awayScore) {
            homeTeam.won += 1;
            homeTeam.pts += 3;
            awayTeam.lost += 1;
          } else if (match.homeScore < match.awayScore) {
            awayTeam.won += 1;
            awayTeam.pts += 3;
            homeTeam.lost += 1;
          } else {
            homeTeam.drawn += 1;
            homeTeam.pts += 1;
            awayTeam.drawn += 1;
            awayTeam.pts += 1;
          }
        }
      }
    });

    return {
      ...group,
      teams: newTeams,
    };
  };

  const handleMatchUpdate = (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null
  ) => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        if (group.name !== groupId) return group;

        // Update match in the group
        const updatedMatches = group.matches.map((match) => {
          if (match.id !== matchId) return match;
          return {
            ...match,
            homeScore: homeScore,
            awayScore: awayScore,
            finished: homeScore !== null && awayScore !== null,
          };
        });

        const updatedGroup = { ...group, matches: updatedMatches };
        return recalculateGroupStats(updatedGroup);
      });
    });
  };

  const handleSimulate = () => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        const updatedMatches = group.matches.map((match) => {
          // Simple random score between 0 and 3
          const homeScore = Math.floor(Math.random() * 4);
          const awayScore = Math.floor(Math.random() * 4);
          return {
            ...match,
            homeScore,
            awayScore,
            finished: true,
          };
        });

        return recalculateGroupStats({ ...group, matches: updatedMatches });
      });
    });
  };

  return (
    <main className="min-h-screen pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Title Section */}
          <div className="shrink-0 text-center md:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              FIFA World Cup{" "}
              <span className="text-blue-600 dark:text-blue-400">2026</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Fixture Oficial & Simulador
            </p>
          </div>

          {/* Tabs Section */}
          <div className="flex p-1 gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl w-full md:w-auto backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("groups")}
              className={clsx(
                "w-full md:w-40 rounded-lg py-2 text-sm font-bold leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200",
                activeTab === "groups"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-white/40 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              Fase de Grupos
            </button>
            <button
              onClick={() => setActiveTab("knockout")}
              className={clsx(
                "w-full md:w-40 rounded-lg py-2 text-sm font-bold leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200",
                activeTab === "knockout"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-white/40 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              Fase Eliminatoria
            </button>
          </div>

          {/* Actions Section */}
          <div className="shrink-0">
            <button
              onClick={handleSimulate}
              className="bg-blue-600/90 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95 transform backdrop-blur-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.312-.312a7 7 0 00-11.712 3.139.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.312h-2.433a.75.75 0 000 1.5h4.242z"
                  clipRule="evenodd"
                />
              </svg>
              Simular Todo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {activeTab === "groups" ? (
          <GroupStage groups={groups} onMatchUpdate={handleMatchUpdate} />
        ) : (
          <KnockoutStage groups={groups} />
        )}
      </div>
    </main>
  );
}
