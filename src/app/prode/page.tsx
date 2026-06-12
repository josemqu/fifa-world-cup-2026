"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTournament } from "@/context/TournamentContext";
import { INITIAL_GROUPS } from "@/data/initialData";
import { Group, KnockoutMatch, Team } from "@/data/types";
import { generateR32Matches } from "@/utils/knockoutUtils";
import { recalculateGroupStats } from "@/utils/simulationUtils";
import {
  R32_MATCHES,
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";
import { KNOCKOUT_DETAILS } from "@/data/knockoutDetails";
import { TeamFlag } from "@/components/ui/TeamFlag";
import { PageTransition } from "@/components/PageTransition";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  Globe,
  Check,
  Copy,
  Plus,
  Minus,
  LogIn,
  Lock,
  Save,
  Loader2,
  Crown,
  Medal,
  ChevronRight,
  ArrowLeft,
  Trash2,
  User as UserIcon,
  Hash,
  Target,
  Zap,
  ShieldCheck,
  Share2,
  AlertTriangle,
  RotateCcw,
  Info,
  X,
} from "lucide-react";

type Tab = "predictions" | "groups" | "leaderboard";

type PredictionEntry = {
  matchId: string;
  homeScore: number | "";
  awayScore: number | "";
  homePenalties?: number | "";
  awayPenalties?: number | "";
};

type GroupData = {
  _id: string;
  name: string;
  code: string;
  ownerUid: string;
  members: string[];
  createdAt: string;
};

type LeaderboardEntry = {
  firebaseUid: string;
  displayName: string;
  nickname?: string;
  totalPoints: number;
  exactCount: number;
  correctCount: number;
  totalPredictions: number;
};

type GroupDetailData = {
  group: GroupData;
  leaderboard: LeaderboardEntry[];
};

// ── Stage config ──
const GROUP_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const KNOCKOUT_STAGES = [
  { key: "R32", label: "16avos" },
  { key: "R16", label: "Octavos" },
  { key: "QF", label: "Cuartos" },
  { key: "SF", label: "Semis" },
  { key: "Final", label: "Final" },
];

function getKnockoutMatchIds(stageKey: string) {
  switch (stageKey) {
    case "R32": return R32_MATCHES.map((m) => m.id);
    case "R16": return R16_MATCHES.map((m) => m.id);
    case "QF": return QF_MATCHES.map((m) => m.id);
    case "SF": return SF_MATCHES.map((m) => m.id);
    case "Final": return FINAL_MATCHES.map((m) => m.id);
    default: return [];
  }
}

// Build full match lookup map
function buildMatchLookup() {
  const map = new Map<string, { homeTeamName: string; awayTeamName: string; utcDate: string; stage: string; groupId?: string; label?: string }>();

  for (const group of INITIAL_GROUPS) {
    for (const match of group.matches) {
      const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
      const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);
      map.set(match.id, {
        homeTeamName: homeTeam?.name || match.homeTeamId,
        awayTeamName: awayTeam?.name || match.awayTeamId,
        utcDate: match.utcDate,
        stage: `Grupo ${group.name}`,
        groupId: group.name,
      });
    }
  }

  const allKnockout = [...R32_MATCHES, ...R16_MATCHES, ...QF_MATCHES, ...SF_MATCHES, ...FINAL_MATCHES];
  const stageLabels: Record<string, string> = {
    R32: "16avos de Final",
    R16: "Octavos de Final",
    QF: "Cuartos de Final",
    SF: "Semifinales",
  };

  for (const m of allKnockout) {
    const details = KNOCKOUT_DETAILS[m.id];
    let stageName = "Final";
    if (R32_MATCHES.includes(m as any)) stageName = "R32";
    else if (R16_MATCHES.includes(m as any)) stageName = "R16";
    else if (QF_MATCHES.includes(m as any)) stageName = "QF";
    else if (SF_MATCHES.includes(m as any)) stageName = "SF";
    else if (m.id === "103") stageName = "3er Puesto";

    map.set(m.id, {
      homeTeamName: (m as any).home || "Por definir",
      awayTeamName: (m as any).away || "Por definir",
      utcDate: details?.utcDate || "",
      stage: stageLabels[stageName] || stageName,
      label: (m as any).label || undefined,
    });
  }

  return map;
}

const MATCH_LOOKUP = buildMatchLookup();

function ProdePageContent() {
  const { user, dbUser, loading, loginWithGoogle } = useAuth();
  const { groups: tournamentGroups, knockoutMatches } = useTournament();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Get initial states from URL search params
  const initialTab = (searchParams.get("tab") as Tab) || "predictions";
  const initialStage = searchParams.get("stage") || "A";
  const initialGroupId = searchParams.get("groupId") || null;

  const [activeTab, setActiveTabState] = useState<Tab>(initialTab);
  const [activeStage, setActiveStageState] = useState<string>(initialStage);
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(initialGroupId);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Sync URL search params with state
  const updateUrl = useCallback((tab: Tab, stage: string, groupId: string | null) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (tab === "predictions") {
      params.set("stage", stage);
    }
    if (tab === "groups" && groupId) {
      params.set("groupId", groupId);
    }
    router.replace(`/prode?${params.toString()}`, { scroll: false });
  }, [router]);

  // Setters that update URL
  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    updateUrl(tab, activeStage, selectedGroupId);
  };

  const setActiveStage = (stage: string) => {
    setActiveStageState(stage);
    updateUrl(activeTab, stage, selectedGroupId);
  };

  const setSelectedGroupId = (groupId: string | null) => {
    setSelectedGroupIdState(groupId);
    updateUrl(activeTab, activeStage, groupId);
  };

  // Auto-join state
  const [autoJoining, setAutoJoining] = useState(false);
  const [autoJoinError, setAutoJoinError] = useState<string | null>(null);
  const [autoJoinSuccess, setAutoJoinSuccess] = useState<string | null>(null);
  const processedCodesRef = useRef<Set<string>>(new Set());

  // Effect for auto-joining a group via link
  useEffect(() => {
    const autoJoin = async () => {
      const joinCode = searchParams.get("joinCode");
      if (!user || !joinCode || autoJoining || processedCodesRef.current.has(joinCode.toUpperCase())) return;

      processedCodesRef.current.add(joinCode.toUpperCase());
      setAutoJoining(true);
      setAutoJoinError(null);
      setAutoJoinSuccess(null);

      try {
        const res = await fetch("/api/prode/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: user.uid,
            code: joinCode.trim().toUpperCase(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAutoJoinSuccess(`¡Te uniste al grupo "${data.data.name}"!`);
          setActiveTab("groups");
          setSelectedGroupId(data.data._id);
          setTimeout(() => setAutoJoinSuccess(null), 5000);
        } else {
          setAutoJoinError(data.error || "No se pudo unir al grupo.");
          setTimeout(() => setAutoJoinError(null), 5000);
          updateUrl(activeTab, activeStage, selectedGroupId);
        }
      } catch (err) {
        console.error("Error in auto-join:", err);
        setAutoJoinError("Error de conexión al intentar unirse al grupo.");
        setTimeout(() => setAutoJoinError(null), 5000);
        updateUrl(activeTab, activeStage, selectedGroupId);
      } finally {
        setAutoJoining(false);
      }
    };
    autoJoin();
  }, [user, searchParams, activeTab, activeStage, selectedGroupId, updateUrl, autoJoining]);

  // Sync from URL changes (e.g. back button / history navigation)
  useEffect(() => {
    const tab = (searchParams.get("tab") as Tab) || "predictions";
    const stage = searchParams.get("stage") || "A";
    const groupId = searchParams.get("groupId") || null;

    setActiveTabState(tab);
    setActiveStageState(stage);
    setSelectedGroupIdState(groupId);
  }, [searchParams]);

  // Initial redirect if parameters are missing
  useEffect(() => {
    if (!searchParams.has("tab") && !searchParams.has("joinCode")) {
      updateUrl(initialTab, initialStage, initialGroupId);
    }
  }, [searchParams, initialTab, initialStage, initialGroupId, updateUrl]);

  if (loading) {
    return (
      <PageTransition className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    return (
      <PageTransition className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Prode Mundial 2026
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
              Predecí los resultados de todos los partidos, competí con tus amigos
              y subí en el ranking global.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Ingresá para participar
          </button>
        </div>
      </PageTransition>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "predictions", label: "Mis Pronósticos", icon: <Target className="w-4 h-4" /> },
    { key: "groups", label: "Mis Grupos", icon: <Users className="w-4 h-4" /> },
    { key: "leaderboard", label: "Tabla General", icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <PageTransition className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Prode</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Predecí, competí, ganá</p>
            </div>
          </div>
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Info className="w-4 h-4 text-emerald-500" />
            <span>Reglas y Puntos</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-sm shadow-inner border border-slate-200/50 dark:border-slate-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
                activeTab === tab.key
                  ? "text-blue-600 dark:text-blue-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="prodeActiveTab"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "predictions" && (
            <motion.div key="predictions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <PredictionsTab
                firebaseUid={user.uid}
                tournamentGroups={tournamentGroups}
                knockoutMatches={knockoutMatches}
                activeStage={activeStage}
                setActiveStage={setActiveStage}
              />
            </motion.div>
          )}
          {activeTab === "groups" && (
            <motion.div key="groups" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <GroupsTab
                firebaseUid={user.uid}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
              />
            </motion.div>
          )}
          {activeTab === "leaderboard" && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <LeaderboardTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {autoJoinSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold pointer-events-auto border border-emerald-400"
            >
              <Check className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-sm">{autoJoinSuccess}</div>
              <button onClick={() => setAutoJoinSuccess(null)} className="hover:opacity-80 text-white cursor-pointer ml-1">
                ✕
              </button>
            </motion.div>
          )}
          {autoJoinError && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold pointer-events-auto border border-red-400"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-sm">{autoJoinError}</div>
              <button onClick={() => setAutoJoinError(null)} className="hover:opacity-80 text-white cursor-pointer ml-1">
                ✕
              </button>
            </motion.div>
          )}
          {autoJoining && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold pointer-events-auto border border-blue-500"
            >
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div className="flex-1 text-sm">Uniéndote al grupo...</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowRulesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Reglas y Sistema de Puntos</h3>
                </div>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Points Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
                    ¿Cómo sumar puntos?
                  </h4>
                  
                  {/* 3 Points */}
                  <div className="flex gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                      3
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Resultado Exacto</p>
                      <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                        Acertás los goles de ambos equipos. En fase de eliminación directa, si el partido termina empatado en el tiempo regular (90 min), debés acertar además qué equipo clasifica por penales.
                      </p>
                    </div>
                  </div>

                  {/* 1 Point */}
                  <div className="flex gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                      1
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Resultado Parcial / Tendencia</p>
                      <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                        Acertás quién gana el partido (pero no por cuántos goles exactos) o acertás que empatan (sin importar si adivinás la cantidad de goles). También sumás 1 punto en eliminación directa si acertás el empate exacto pero no quién clasifica.
                      </p>
                    </div>
                  </div>

                  {/* 0 Points */}
                  <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-slate-400 dark:bg-slate-700 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                      0
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Sin Aciertos</p>
                      <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                        No acertás el ganador ni el empate.
                      </p>
                    </div>
                  </div>
                </div>

                {/* General Rules Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
                    Reglas Generales
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
                    <li>
                      <strong className="text-slate-800 dark:text-slate-200">Límite de tiempo:</strong> Podés cambiar tus pronósticos hasta el horario exacto del inicio de cada partido. Una vez comenzado, se bloquea automáticamente.
                    </li>
                    <li>
                      <strong className="text-slate-800 dark:text-slate-200">Fase de Grupos:</strong> Se pronostica el resultado final de los 90 minutos de juego (más tiempo de descuento).
                    </li>
                    <li>
                      <strong className="text-slate-800 dark:text-slate-200">Fase Eliminatoria:</strong> Si ingresás un empate en el marcador, se habilitará una opción para que elijas qué equipo clasifica por penales. Si pronosticás que un equipo gana, no es necesario elegir los penales.
                    </li>
                    <li>
                      <strong className="text-slate-800 dark:text-slate-200">Guardado Automático:</strong> A medida que modificás los números de goles, verás un indicador arriba que dice "Guardado". No hace falta apretar ningún botón de guardar.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end shrink-0">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

export default function ProdePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}>
      <ProdePageContent />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── PREDICTIONS TAB ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// ─── PREDICTIONS TAB ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

function formatPlaceholder(ph: string): string {
  if (!ph) return "Por definir";
  // Matches "1A", "2B", "3A", etc.
  if (/^[1-3][A-L]$/.test(ph)) {
    const rank = ph.charAt(0);
    const group = ph.charAt(1);
    return `${rank}° Grupo ${group}`;
  }
  // Matches "W73", "W104", etc.
  if (ph.startsWith("W")) {
    return `Ganador #${ph.substring(1)}`;
  }
  // Matches "L101", etc.
  if (ph.startsWith("L")) {
    return `Perdedor #${ph.substring(1)}`;
  }
  return ph;
}

function PredictionsTab({
  firebaseUid,
  tournamentGroups,
  knockoutMatches,
  activeStage,
  setActiveStage,
}: {
  firebaseUid: string;
  tournamentGroups: any[];
  knockoutMatches: any[];
  activeStage: string;
  setActiveStage: (stage: string) => void;
}) {
  const [predictions, setPredictions] = useState<Map<string, PredictionEntry>>(new Map());
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Map<string, PredictionEntry>>(new Map());

  // Load existing predictions
  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const res = await fetch(`/api/prode/predictions?uid=${firebaseUid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const map = new Map<string, PredictionEntry>();
            for (const p of data.data) {
              map.set(p.matchId, {
                matchId: p.matchId,
                homeScore: p.homeScore,
                awayScore: p.awayScore,
                homePenalties: p.homePenalties ?? "",
                awayPenalties: p.awayPenalties ?? ""
              });
            }
            setPredictions(map);
          }
        }
      } catch (err) {
        console.error("Error loading predictions:", err);
      } finally {
        setLoadingPredictions(false);
      }
    };
    loadPredictions();
  }, [firebaseUid]);

  const savePredictions = useCallback(async (toSave: Map<string, PredictionEntry>) => {
    if (toSave.size === 0) return;
    setSaving(true);
    try {
      const predsArray = Array.from(toSave.values()).filter(
        (p) => (p.homeScore !== "" && p.awayScore !== "") || (p.homeScore === "" && p.awayScore === "")
      );
      if (predsArray.length === 0) { setSaving(false); return; }

      const res = await fetch("/api/prode/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid,
          predictions: predsArray.map((p) => ({
            matchId: p.matchId,
            homeScore: p.homeScore === "" ? null : Number(p.homeScore),
            awayScore: p.awayScore === "" ? null : Number(p.awayScore),
            homePenalties: p.homePenalties !== undefined && p.homePenalties !== "" ? Number(p.homePenalties) : undefined,
            awayPenalties: p.awayPenalties !== undefined && p.awayPenalties !== "" ? Number(p.awayPenalties) : undefined,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedCount((c) => c + (data.saved || 0));
      }
    } catch (err) {
      console.error("Error saving predictions:", err);
    } finally {
      setSaving(false);
      pendingRef.current.clear();
    }
  }, [firebaseUid]);

  const handleScoreChange = useCallback((matchId: string, side: "home" | "away", val: string) => {
    const score = val === "" ? "" : Math.max(0, parseInt(val) || 0);
    setPredictions((prev) => {
      const newMap = new Map(prev);
      const existing = (newMap.get(matchId) || { matchId, homeScore: "", awayScore: "", homePenalties: "", awayPenalties: "" }) as PredictionEntry;
      const newHomeScore = side === "home" ? score : existing.homeScore;
      const newAwayScore = side === "away" ? score : existing.awayScore;
      const isTie = newHomeScore !== "" && newAwayScore !== "" && newHomeScore === newAwayScore;

      const updated: PredictionEntry = {
        ...existing,
        [side === "home" ? "homeScore" : "awayScore"]: score,
        ...(!isTie ? { homePenalties: "", awayPenalties: "" } : {})
      };
      newMap.set(matchId, updated);
      return newMap;
    });

    // Debounce save
    const entry = (predictions.get(matchId) || { matchId, homeScore: "", awayScore: "", homePenalties: "", awayPenalties: "" }) as PredictionEntry;
    const newHomeScore = side === "home" ? score : entry.homeScore;
    const newAwayScore = side === "away" ? score : entry.awayScore;
    const isTie = newHomeScore !== "" && newAwayScore !== "" && newHomeScore === newAwayScore;

    const updated: PredictionEntry = {
      ...entry,
      [side === "home" ? "homeScore" : "awayScore"]: score,
      ...(!isTie ? { homePenalties: "", awayPenalties: "" } : {})
    };
    pendingRef.current.set(matchId, updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePredictions(new Map(pendingRef.current));
    }, 1500);
  }, [predictions, savePredictions]);

  const handlePenaltiesWinnerChange = useCallback((matchId: string, winnerSide: "home" | "away") => {
    setPredictions((prev) => {
      const newMap = new Map(prev);
      const existing = (newMap.get(matchId) || { matchId, homeScore: "", awayScore: "", homePenalties: "", awayPenalties: "" }) as PredictionEntry;
      const updated: PredictionEntry = {
        ...existing,
        homePenalties: winnerSide === "home" ? 1 : 0,
        awayPenalties: winnerSide === "away" ? 1 : 0,
      };
      newMap.set(matchId, updated);
      return newMap;
    });

    const entry = (predictions.get(matchId) || { matchId, homeScore: "", awayScore: "", homePenalties: "", awayPenalties: "" }) as PredictionEntry;
    const updated: PredictionEntry = {
      ...entry,
      homePenalties: winnerSide === "home" ? 1 : 0,
      awayPenalties: winnerSide === "away" ? 1 : 0,
    };
    pendingRef.current.set(matchId, updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePredictions(new Map(pendingRef.current));
    }, 1500);
  }, [predictions, savePredictions]);

  const handleResetMatch = useCallback((matchId: string) => {
    setPredictions((prev) => {
      const newMap = new Map(prev);
      const existing = (newMap.get(matchId) || { matchId, homeScore: "", awayScore: "", homePenalties: "", awayPenalties: "" }) as PredictionEntry;
      const updated: PredictionEntry = {
        ...existing,
        homeScore: "",
        awayScore: "",
        homePenalties: "",
        awayPenalties: ""
      };
      newMap.set(matchId, updated);
      return newMap;
    });

    const entry = (predictions.get(matchId) || { matchId, homeScore: "", awayScore: "", homePenalties: "", awayPenalties: "" }) as PredictionEntry;
    const updated: PredictionEntry = {
      ...entry,
      homeScore: "",
      awayScore: "",
      homePenalties: "",
      awayPenalties: ""
    };
    pendingRef.current.set(matchId, updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePredictions(new Map(pendingRef.current));
    }, 1500);
  }, [predictions, savePredictions]);

  // Determine which match IDs to show for the active stage
  const stageMatchIds = useMemo(() => {
    if (GROUP_LABELS.includes(activeStage)) {
      const group = INITIAL_GROUPS.find((g) => g.name === activeStage);
      return group ? group.matches.map((m) => m.id) : [];
    }
    return getKnockoutMatchIds(activeStage);
  }, [activeStage]);

  // Resolve team names from our local dynamically-propagated prode matches
  const prodeMatches = useMemo(() => {
    // 1. Deep clone INITIAL_GROUPS
    const clonedGroups = JSON.parse(JSON.stringify(INITIAL_GROUPS)) as Group[];

    // 2. Overlay user predictions on clonedGroups
    for (const group of clonedGroups) {
      for (const match of group.matches) {
        const pred = predictions.get(match.id);
        if (pred && pred.homeScore !== "" && pred.awayScore !== "") {
          match.homeScore = Number(pred.homeScore);
          match.awayScore = Number(pred.awayScore);
          match.finished = true;
        } else {
          match.homeScore = null;
          match.awayScore = null;
          match.finished = false;
        }
      }
      // Recalculate standings for this group
      const updated = recalculateGroupStats(group);
      group.teams = updated.teams;
    }

    // 3. Generate R32 matches based on group standings predictions
    const r32Matches = generateR32Matches(clonedGroups);

    // 4. Set up all knockout matches structure
    const allKnockouts = new Map<string, KnockoutMatch>();

    // Add R32 matches
    for (const m of r32Matches) {
      allKnockouts.set(m.id, {
        ...m,
        homeScore: null,
        awayScore: null,
        winner: null
      });
    }

    // Add R16, QF, SF, Final, 3rdPlace
    const remainingDefs = [...R16_MATCHES, ...QF_MATCHES, ...SF_MATCHES, ...FINAL_MATCHES];

    for (const def of remainingDefs) {
      allKnockouts.set(def.id, {
        id: def.id,
        stage: def.id === "103" ? "3rdPlace" : (def.id === "104" ? "Final" : (Number(def.id) >= 101 ? "SF" : (Number(def.id) >= 97 ? "QF" : "R16"))),
        homeTeam: { placeholder: def.home },
        awayTeam: { placeholder: def.away },
        homeScore: null,
        awayScore: null,
        winner: null,
        nextMatchId: def.next || undefined,
        utcDate: def.utcDate,
        location: def.location
      });
    }

    // 5. Sequential propagation (IDs 73 to 104)
    const sortedIds = Array.from(allKnockouts.keys()).sort((a, b) => Number(a) - Number(b));
    const matchResults = new Map<string, { winner: Team | null; loser: Team | null }>();

    for (const id of sortedIds) {
      const match = allKnockouts.get(id)!;

      // Resolve homeTeam from previous matches if placeholder
      if (match.homeTeam && "placeholder" in match.homeTeam) {
        const ph = match.homeTeam.placeholder; // e.g. "W73" or "L101"
        if (ph.startsWith("W") || ph.startsWith("L")) {
          const sourceId = ph.substring(1);
          const sourceRes = matchResults.get(sourceId);
          if (sourceRes) {
            match.homeTeam = ph.startsWith("W") ? sourceRes.winner : sourceRes.loser;
          }
        }
      }

      // Resolve awayTeam from previous matches if placeholder
      if (match.awayTeam && "placeholder" in match.awayTeam) {
        const ph = match.awayTeam.placeholder; // e.g. "W74" or "L102"
        if (ph.startsWith("W") || ph.startsWith("L")) {
          const sourceId = ph.substring(1);
          const sourceRes = matchResults.get(sourceId);
          if (sourceRes) {
            match.awayTeam = ph.startsWith("W") ? sourceRes.winner : sourceRes.loser;
          }
        }
      }

      // Check user prediction for this match
      const pred = predictions.get(id);
      if (pred && pred.homeScore !== "" && pred.awayScore !== "") {
        match.homeScore = Number(pred.homeScore);
        match.awayScore = Number(pred.awayScore);
        match.homePenalties = pred.homePenalties !== undefined && pred.homePenalties !== "" ? Number(pred.homePenalties) : null;
        match.awayPenalties = pred.awayPenalties !== undefined && pred.awayPenalties !== "" ? Number(pred.awayPenalties) : null;

        // Calculate winner/loser only if teams are real teams (not placeholders)
        if (
          match.homeTeam &&
          !("placeholder" in match.homeTeam) &&
          match.awayTeam &&
          !("placeholder" in match.awayTeam)
        ) {
          const hTeam = match.homeTeam as Team;
          const aTeam = match.awayTeam as Team;
          const homeS = Number(pred.homeScore);
          const awayS = Number(pred.awayScore);

          let winner: Team | null = null;
          let loser: Team | null = null;

          if (homeS > awayS) {
            winner = hTeam;
            loser = aTeam;
          } else if (awayS > homeS) {
            winner = aTeam;
            loser = hTeam;
          } else {
            // Tie-breaker: Check if user predicted penalties winner
            if (pred.homePenalties === 1 && pred.awayPenalties === 0) {
              winner = hTeam;
              loser = aTeam;
            } else if (pred.awayPenalties === 1 && pred.homePenalties === 0) {
              winner = aTeam;
              loser = hTeam;
            } else {
              // Fallback: FIFA ranking (lower is better)
              const rHome = hTeam.ranking || 999;
              const rAway = aTeam.ranking || 999;
              if (rHome < rAway) {
                winner = hTeam;
                loser = aTeam;
              } else {
                winner = aTeam;
                loser = hTeam;
              }
            }
          }
          match.winner = winner;
          matchResults.set(id, { winner, loser });
        }
      }
    }

    return allKnockouts;
  }, [predictions]);

  // Resolve team names from tournament context for knockout matches
  const resolvedTeamNames = useMemo(() => {
    const map = new Map<string, { home: string; away: string }>();
    for (const [id, km] of prodeMatches) {
      const homeName = km.homeTeam
        ? ("placeholder" in km.homeTeam ? formatPlaceholder(km.homeTeam.placeholder) : km.homeTeam.name)
        : "Por definir";
      const awayName = km.awayTeam
        ? ("placeholder" in km.awayTeam ? formatPlaceholder(km.awayTeam.placeholder) : km.awayTeam.name)
        : "Por definir";
      map.set(id, { home: homeName, away: awayName });
    }
    return map;
  }, [prodeMatches]);

  if (loadingPredictions) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Save Status Indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ingresá tu pronóstico para cada partido. Se guardan automáticamente.
        </p>
        <div className="flex items-center gap-2 text-xs">
          {saving ? (
            <span className="flex items-center gap-1.5 text-blue-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Guardando...
            </span>
          ) : savedCount > 0 ? (
            <span className="flex items-center gap-1.5 text-emerald-500">
              <Check className="w-3.5 h-3.5" />
              Guardado
            </span>
          ) : null}
        </div>
      </div>

      {/* Stage Selector */}
      <div className="space-y-2">
        {/* Group Stage pills */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
          {GROUP_LABELS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveStage(g)}
              className={clsx(
                "flex-1 min-w-[28px] py-1.5 rounded-md text-xs font-bold transition-all text-center",
                activeStage === g
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {g}
            </button>
          ))}
        </div>
        {/* Knockout stage pills */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
          {KNOCKOUT_STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveStage(s.key)}
              className={clsx(
                "flex-1 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap text-center",
                activeStage === s.key
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards */}
      <div className="space-y-3">
        {stageMatchIds.map((matchId) => {
          const info = MATCH_LOOKUP.get(matchId);
          const resolved = resolvedTeamNames.get(matchId);
          const homeName = resolved?.home || info?.homeTeamName || "?";
          const awayName = resolved?.away || info?.awayTeamName || "?";
          const utcDate = info?.utcDate || "";
          const isLocked = utcDate ? new Date() >= new Date(utcDate) : false;
          const pred = predictions.get(matchId);

          return (
            <ProdeMatchCard
              key={matchId}
              matchId={matchId}
              homeTeamName={homeName}
              awayTeamName={awayName}
              utcDate={utcDate}
              isLocked={isLocked}
              homeScore={pred?.homeScore ?? ""}
              awayScore={pred?.awayScore ?? ""}
              homePenalties={pred?.homePenalties ?? ""}
              awayPenalties={pred?.awayPenalties ?? ""}
              onScoreChange={handleScoreChange}
              onPenaltiesWinnerChange={handlePenaltiesWinnerChange}
              onResetMatch={handleResetMatch}
              label={info?.label}
            />
          );
        })}
        {stageMatchIds.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600">
            No hay partidos en esta etapa.
          </div>
        )}
      </div>
    </div>
  );
}

function ProdeMatchCard({
  matchId,
  homeTeamName,
  awayTeamName,
  utcDate,
  isLocked,
  homeScore,
  awayScore,
  homePenalties,
  awayPenalties,
  onScoreChange,
  onPenaltiesWinnerChange,
  onResetMatch,
  label,
}: {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  utcDate: string;
  isLocked: boolean;
  homeScore: number | "";
  awayScore: number | "";
  homePenalties?: number | "";
  awayPenalties?: number | "";
  onScoreChange: (matchId: string, side: "home" | "away", val: string) => void;
  onPenaltiesWinnerChange: (matchId: string, winnerSide: "home" | "away") => void;
  onResetMatch: (matchId: string) => void;
  label?: string;
}) {
  const matchDate = utcDate ? new Date(utcDate) : null;
  const formattedDate = matchDate
    ? matchDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    : "";
  const formattedTime = matchDate
    ? matchDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

  const adjustScore = (side: "home" | "away", delta: number) => {
    if (isLocked) return;
    const currentVal = side === "home" ? homeScore : awayScore;
    const currentNum = currentVal === "" ? 0 : Number(currentVal);
    const newVal = Math.max(0, currentNum + delta);
    onScoreChange(matchId, side, newVal.toString());
  };

  const isKnockout = /^\d+$/.test(matchId);
  const isTie = homeScore !== "" && awayScore !== "" && homeScore === awayScore;
  const showPenaltiesSelector = isKnockout && isTie;

  return (
    <div
      className={clsx(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all",
        isLocked && "opacity-70"
      )}
    >
      <div className="p-3 sm:p-4">
        {label && (
          <div className="mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700/50 text-center">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {label}
            </span>
          </div>
        )}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Home Team */}
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamFlag teamName={homeTeamName} className="w-7 h-5 shrink-0 rounded-sm shadow-sm" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {homeTeamName}
            </span>
          </div>

          {/* Score Inputs */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {!isLocked && (
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => adjustScore("home", 1)}
                    className="flex items-center justify-center w-4 h-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 active:scale-90 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all"
                    title="Aumentar"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustScore("home", -1)}
                    className="flex items-center justify-center w-4 h-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 active:scale-90 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all"
                    title="Disminuir"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
              <input
                type="number"
                min="0"
                max="20"
                placeholder="-"
                disabled={isLocked}
                value={homeScore}
                onChange={(e) => onScoreChange(matchId, "home", e.target.value)}
                className="w-10 h-10 text-center text-sm font-bold bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">:</span>

            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="20"
                placeholder="-"
                disabled={isLocked}
                value={awayScore}
                onChange={(e) => onScoreChange(matchId, "away", e.target.value)}
                className="w-10 h-10 text-center text-sm font-bold bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {!isLocked && (
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => adjustScore("away", 1)}
                    className="flex items-center justify-center w-4 h-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 active:scale-90 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all"
                    title="Aumentar"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustScore("away", -1)}
                    className="flex items-center justify-center w-4 h-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 active:scale-90 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all"
                    title="Disminuir"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
            {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 ml-1" />}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-2.5 min-w-0 justify-end">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate text-right">
              {awayTeamName}
            </span>
            <TeamFlag teamName={awayTeamName} className="w-7 h-5 shrink-0 rounded-sm shadow-sm" />
          </div>
        </div>

        {/* Penalties Winner Selector */}
        {showPenaltiesSelector && (
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex flex-col items-center gap-1.5 animate-fade-in">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              ¿Quién avanza por penales?
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => onPenaltiesWinnerChange(matchId, "home")}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                  homePenalties === 1 && awayPenalties === 0
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                )}
              >
                {homeTeamName}
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => onPenaltiesWinnerChange(matchId, "away")}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                  awayPenalties === 1 && homePenalties === 0
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                )}
              >
                {awayTeamName}
              </button>
            </div>
          </div>
        )}

        {/* Match Date & Time / Reset Button */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            {matchDate && (
              <>
                <span>{formattedDate}</span>
                <span className="font-bold text-slate-500 dark:text-slate-400">{formattedTime}</span>
              </>
            )}
            <span className="font-mono text-[9px] text-slate-350 dark:text-slate-650">#{matchId}</span>
          </div>
          {!isLocked && (homeScore !== "" || awayScore !== "") && (
            <button
              type="button"
              onClick={() => onResetMatch(matchId)}
              className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="Resetear pronóstico"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resetear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── GROUPS TAB ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function GroupsTab({
  firebaseUid,
  selectedGroupId,
  setSelectedGroupId,
}: {
  firebaseUid: string;
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
}) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupDetail, setGroupDetail] = useState<GroupDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create group state
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  // Join group state
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Clipboard copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLinkCode, setCopiedLinkCode] = useState<string | null>(null);

  const handleShareWhatsApp = (name: string, code: string) => {
    const inviteLink = `${window.location.origin}/prode?joinCode=${code}`;
    const text = `🏆 ¡Sumate a mi grupo de prode *${name}* para el Mundial 2026! ⚽\n\n👉 Hacé clic en este link para unirte automáticamente:\n${inviteLink}\n\nO ingresá el código de invitación desde la app: *${code}*`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  const handleShareLink = async (name: string, code: string) => {
    const inviteLink = `${window.location.origin}/prode?joinCode=${code}`;
    const shareData = {
      title: `Prode Mundial 2026 - Grupo ${name}`,
      text: `¡Sumate a mi grupo de prode "${name}" para el Mundial 2026!`,
      url: inviteLink,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log("Error sharing:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLinkCode(code);
      setTimeout(() => setCopiedLinkCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch(`/api/prode/groups?uid=${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setGroups(data.data || []);
      }
    } catch (err) {
      console.error("Error loading groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, [firebaseUid]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/prode/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid, name: newGroupName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGroups((prev) => [...prev, data.data]);
          setNewGroupName("");
          setShowCreate(false);
        }
      }
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch("/api/prode/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid, code: joinCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGroups((prev) => {
          const exists = prev.find((g) => g._id === data.data._id);
          if (exists) return prev;
          return [...prev, data.data];
        });
        setJoinCode("");
        setShowJoin(false);
      } else {
        setJoinError(data.error || "No se pudo unir al grupo.");
      }
    } catch (err) {
      setJoinError("Error de conexión.");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openGroupDetail = useCallback(async (groupId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/prode/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setGroupDetail(data.data);
      }
    } catch (err) {
      console.error("Error loading group detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      openGroupDetail(selectedGroupId);
    } else {
      setGroupDetail(null);
    }
  }, [selectedGroupId, openGroupDetail]);

  // Group detail view
  if (selectedGroupId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedGroupId(null); setGroupDetail(null); }}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis grupos
        </button>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : groupDetail ? (
          <div className="space-y-4">
            {/* Group Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{groupDetail.group.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {groupDetail.group.members.length} miembros
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 mr-2">
                      Código: {groupDetail.group.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(groupDetail.group.code)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedCode === groupDetail.group.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => handleShareWhatsApp(groupDetail.group.name, groupDetail.group.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba56] text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                    title="Compartir por WhatsApp"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleShareLink(groupDetail.group.name, groupDetail.group.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                    title="Compartir Link de Invitación"
                  >
                    {copiedLinkCode === groupDetail.group.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Compartir Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tabla de Posiciones</h4>
              </div>
              {groupDetail.leaderboard.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {(() => {
                    let currentRank = 1;
                    return groupDetail.leaderboard.map((entry, index) => {
                      if (index > 0 && entry.totalPoints < groupDetail.leaderboard[index - 1].totalPoints) {
                        currentRank = index + 1;
                      }
                      const isCurrentUser = firebaseUid === entry.firebaseUid;
                      return (
                        <div
                          key={entry.firebaseUid}
                          className={clsx(
                            "relative flex items-center gap-3 px-5 py-3 transition-colors",
                            isCurrentUser
                              ? "bg-blue-50/40 dark:bg-blue-950/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          {isCurrentUser && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-md" />
                          )}
                          <div className="w-8 flex justify-center">
                            {currentRank === 1 ? <Crown className="w-5 h-5 text-yellow-500" /> :
                             currentRank === 2 ? <Medal className="w-5 h-5 text-slate-400" /> :
                             currentRank === 3 ? <Medal className="w-5 h-5 text-amber-700" /> :
                             <span className="text-sm font-mono text-slate-400">{currentRank}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={clsx(
                              "text-sm font-medium truncate",
                              isCurrentUser ? "text-blue-700 dark:text-blue-300 font-bold" : "text-slate-900 dark:text-slate-100"
                            )}>
                              {entry.nickname || entry.displayName}
                              {isCurrentUser && <span className="ml-2 text-[10px] text-blue-500 font-normal">(Vos)</span>}
                            </p>
                            <div className="flex gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{entry.exactCount} exactos</span>
                              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />{entry.correctCount} aciertos</span>
                              <span>{entry.totalPredictions} pronósticos</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{entry.totalPoints}</span>
                            <span className="text-[10px] text-slate-400 ml-1">pts</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                  <p>Aún no hay resultados. Los puntos aparecerán cuando los partidos terminen.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Groups list view
  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Grupo
        </button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 text-sm"
        >
          <LogIn className="w-4 h-4" />
          Unirse con Código
        </button>
      </div>

      {/* Create Group Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Nuevo Grupo</h4>
              <input
                type="text"
                placeholder="Nombre del grupo (ej: Amigos del fútbol)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={creating || !newGroupName.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white font-bold rounded-lg text-sm transition-all flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Crear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Group Form */}
      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unirse a un Grupo</h4>
              <input
                type="text"
                placeholder="Código de 6 dígitos (ej: DF5R3E)"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError(""); }}
                maxLength={6}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-mono text-center text-lg tracking-[0.3em] uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
              />
              {joinError && <p className="text-xs text-red-500">{joinError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowJoin(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleJoinGroup}
                  disabled={joining || joinCode.length < 6}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white font-bold rounded-lg text-sm transition-all flex items-center gap-2"
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Unirse
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups List */}
      {loadingGroups ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group._id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedGroupId(group._id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedGroupId(group._id);
                }
              }}
              className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{group.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {group.code}
                  </span>
                  <span>·</span>
                  <span>{group.members.length} miembros</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(group.name, group.code); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                  title="Compartir por WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleShareLink(group.name, group.code); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                  title="Compartir Link de Invitación"
                >
                  {copiedLinkCode === group.code ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Share2 className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCopyCode(group.code); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                  title="Copiar código"
                >
                  {copiedCode === group.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No tenés grupos todavía</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Creá uno o unite con un código de invitación.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── GLOBAL LEADERBOARD TAB ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════

function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const res = await fetch("/api/prode/leaderboard");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setLeaderboard(data.data || []);
        }
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    loadLeaderboard();
  }, []);

  if (loadingLeaderboard) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
          <Globe className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No hay datos en la tabla general</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Los puntos aparecerán cuando los partidos terminen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900/50 dark:to-blue-950/20">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Ranking Global — Top {leaderboard.length}
        </h4>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {(() => {
          let currentRank = 1;
          return leaderboard.map((entry, index) => {
            if (index > 0 && entry.totalPoints < leaderboard[index - 1].totalPoints) {
              currentRank = index + 1;
            }
            const isCurrentUser = user?.uid === entry.firebaseUid;
            return (
              <div
                key={entry.firebaseUid}
                className={clsx(
                  "relative flex items-center gap-3 px-5 py-3 transition-colors",
                  isCurrentUser
                    ? "bg-blue-50/40 dark:bg-blue-950/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                {isCurrentUser && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-md" />
                )}
                <div className="w-8 flex justify-center">
                  {currentRank === 1 ? <Crown className="w-5 h-5 text-yellow-500" /> :
                   currentRank === 2 ? <Medal className="w-5 h-5 text-slate-400" /> :
                   currentRank === 3 ? <Medal className="w-5 h-5 text-amber-700" /> :
                   <span className="text-sm font-mono text-slate-400">{currentRank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    "text-sm font-medium truncate",
                    isCurrentUser ? "text-blue-700 dark:text-blue-300 font-bold" : "text-slate-900 dark:text-slate-100"
                  )}>
                    {entry.nickname || entry.displayName}
                    {isCurrentUser && <span className="ml-2 text-[10px] text-blue-500 font-normal">(Vos)</span>}
                  </p>
                  <div className="flex gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{entry.exactCount} exactos</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />{entry.correctCount} aciertos</span>
                    <span>{entry.totalPredictions} pronósticos</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{entry.totalPoints}</span>
                  <span className="text-[10px] text-slate-400 ml-1">pts</span>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
