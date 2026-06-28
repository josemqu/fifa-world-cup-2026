"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTournament } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { GroupStage } from "@/components/GroupStage";
import { KnockoutStage } from "@/components/KnockoutStage";
import { TournamentStatsCard } from "@/components/TournamentStatsCard";
import { Trophy, GitFork, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

function FixturePageContent() {
  const {
    groups,
    knockoutMatches,
    updateMatch,
    updateKnockoutMatch,
  } = useTournament();

  const { dbUser, user } = useAuth();
  const isAdmin = useMemo(() => {
    return dbUser?.role === "admin" ||
      !!user?.email?.toLowerCase().includes("mailjmq") ||
      !!dbUser?.email?.toLowerCase().includes("mailjmq");
  }, [dbUser, user]);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State syncing with search params: "groups" or "knockout"
  const activeTab = (searchParams.get("tab") as "groups" | "knockout") || "knockout";

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setActiveTab = (tab: "groups" | "knockout") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/fixture?${params.toString()}`, { scroll: false });
  };

  return (
    <PageTransition className="max-w-[1600px] mx-auto p-4 md:p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Fixture del Mundial 2026
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
              Explorá la fase de grupos y simulá los cruces de la segunda fase rumbo a la gran final.
            </p>
          </div>
        </div>

        {/* Sub-tab Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex p-1 gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-sm shadow-inner border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-max">
            <button
              onClick={() => setActiveTab("groups")}
              className={clsx(
                "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
                activeTab === "groups"
                  ? "text-blue-600 dark:text-blue-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {activeTab === "groups" && (
                <motion.div
                  layoutId="fixtureSubTab"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5" />
                Grupos
              </span>
            </button>

            <button
              onClick={() => setActiveTab("knockout")}
              className={clsx(
                "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
                activeTab === "knockout"
                  ? "text-blue-600 dark:text-blue-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {activeTab === "knockout" && (
                <motion.div
                  layoutId="fixtureSubTab"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <GitFork className="w-3.5 h-3.5" />
                Llaves
              </span>
            </button>
          </div>

          {isAnalyzing && (
            <div className="flex items-center ml-1">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {/* Sub-tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "groups" ? (
            <motion.div
              key="groups-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GroupStage
                groups={groups}
                onMatchUpdate={updateMatch}
                onAnalyzingChange={setIsAnalyzing}
              />
            </motion.div>
          ) : (
            <motion.div
              key="knockout-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <KnockoutStage
                groups={groups}
                matches={knockoutMatches}
                onMatchUpdate={updateKnockoutMatch}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tournament Stats */}
        <TournamentStatsCard
          groups={groups}
          knockoutMatches={knockoutMatches}
        />
      </div>
    </PageTransition>
  );
}

export default function FixturePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <FixturePageContent />
    </Suspense>
  );
}
