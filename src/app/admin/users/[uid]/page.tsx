"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ChevronLeft,
  Activity,
  LogIn,
  Eye,
  Trophy,
  User,
  PlusCircle,
  UserPlus,
  MessageSquare,
  MapPin,
  Mail,
  Calendar,
  Compass,
  FileText,
  RefreshCw,
  Clock,
  FilterX,
  Sparkles,
  Users,
} from "lucide-react";

interface DbUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  nickname?: string;
  country?: string;
  favoriteTeam?: string;
  gender?: string;
  age?: number;
  birthDate?: string;
  role?: string;
  createdAt: string;
}

interface ActivityEvent {
  _id: string;
  firebaseUid: string;
  action: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface UserStats {
  loginCount: number;
  predictionCount: number;
  groupsCount: number;
  feedbackCount: number;
  pageViewsCount: number;
}

interface TopPage {
  path: string;
  count: number;
}

interface DailyPageView {
  date: string;
  path: string;
  count: number;
}

interface SimpleUser {
  firebaseUid: string;
  displayName?: string;
  email?: string;
  nickname?: string;
}

interface UserActivityData {
  user: DbUser;
  stats: UserStats;
  topPages: TopPage[];
  activities: (ActivityEvent & { user?: SimpleUser | null })[];
  dailyPageViews: DailyPageView[];
  users: SimpleUser[];
}

export default function UserBehaviorPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const { dbUser: loggedInUser } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<UserActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [selectedPathFilters, setSelectedPathFilters] = useState<string[]>([]);
  const [selectedActionFilters, setSelectedActionFilters] = useState<string[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const toggleActionFilter = (action: string) => {
    setSelectedActionFilters((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const togglePathFilter = (path: string) => {
    setSelectedPathFilters((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const fetchBehaviorData = async (isRefresh = false) => {
    if (!uid || !loggedInUser?.email) return;
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/activity?uid=${uid}`, {
        headers: { "x-admin-email": loggedInUser.email },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Error al cargar la actividad del usuario");
      }
    } catch (err) {
      console.error("Error fetching user activity details:", err);
      setError("Error de conexión al cargar la actividad del usuario");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBehaviorData();
  }, [uid, loggedInUser?.email]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBehaviorData(true);
  };

  // Highly distinct flat color palette for page paths
  const PATH_COLORS = useMemo(() => [
    "#4f46e5", // Indigo
    "#16a34a", // Emerald Green
    "#db2777", // Hot Pink
    "#0891b2", // Cyan Blue
    "#d97706", // Amber Gold
    "#7c3aed", // Purple
    "#ea580c", // Bright Orange
    "#dc2626", // Crimson Red
  ], []);

  // Extract all unique paths visited by the user
  const uniquePaths = useMemo(() => {
    if (!data?.dailyPageViews) return [];
    const paths = new Set<string>();
    data.dailyPageViews.forEach((v) => {
      if (v.path) paths.add(v.path);
    });
    return Array.from(paths);
  }, [data?.dailyPageViews]);

  // Resolve which paths to render in the stacked chart
  const pathsToRender = useMemo(() => {
    if (selectedPathFilters.length > 0) {
      return selectedPathFilters;
    }
    return uniquePaths;
  }, [uniquePaths, selectedPathFilters]);

  // 1. Process chart data based on active page path filters (stacked format)
  const chartData = useMemo(() => {
    if (!data?.dailyPageViews) return [];

    // Map each day (continuous last 30 days) to a record of path counts
    const dateMap = new Map<string, Record<string, number>>();

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const record: Record<string, number> = {};
      uniquePaths.forEach((path) => {
        record[path] = 0;
      });
      dateMap.set(dateStr, record);
    }

    // Populate with actual data
    data.dailyPageViews.forEach((v) => {
      if (dateMap.has(v.date)) {
        const record = dateMap.get(v.date)!;
        record[v.path] = (record[v.path] || 0) + v.count;
      }
    });

    // Format for recharts
    return Array.from(dateMap.entries()).map(([date, record]) => ({
      date,
      ...record,
    }));
  }, [data?.dailyPageViews, uniquePaths]);

  // 2. Filtered Activities for the Timeline
  const filteredActivities = useMemo(() => {
    if (!data?.activities) return [];

    return data.activities.filter((act) => {
      // Apply Action Filters
      if (selectedActionFilters.length > 0 && !selectedActionFilters.includes(act.action)) {
        return false;
      }

      // Apply Path Filter (if timeline action is PAGE_VIEW and path filter is set)
      if (selectedPathFilters.length > 0) {
        if (act.action !== "PAGE_VIEW") return false;
        if (!selectedPathFilters.includes(act.metadata?.path || "")) return false;
      }

      // Apply Date Filter (YYYY-MM-DD matches event createdAt local date)
      if (selectedDateFilter) {
        const eventDateStr = act.createdAt.split("T")[0];
        if (eventDateStr !== selectedDateFilter) return false;
      }

      return true;
    });
  }, [data?.activities, selectedActionFilters, selectedPathFilters, selectedDateFilter]);

  // Clean all filters
  const clearFilters = () => {
    setSelectedPathFilters([]);
    setSelectedActionFilters([]);
    setSelectedDateFilter(null);
  };

  const hasAnyFilter = selectedPathFilters.length > 0 || selectedActionFilters.length > 0 || selectedDateFilter !== null;

  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const fmtChartDate = (d: string) => {
    try {
      const [, month, day] = d.split("-");
      return `${day}/${month}`;
    } catch {
      return d;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Ahora mismo";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} hr`;
      if (diffDays === 1) return "Ayer";
      if (diffDays < 7) return `Hace ${diffDays} días`;

      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return "-";
    }
  };

  const getEventIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
        return {
          icon: LogIn,
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "PAGE_VIEW":
        return {
          icon: Eye,
          bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "PREDICTION_MADE":
      case "PREDICTION_UPDATED":
        return {
          icon: Trophy,
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      case "PROFILE_UPDATED":
        return {
          icon: User,
          bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
        };
      case "GROUP_CREATED":
        return {
          icon: PlusCircle,
          bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        };
      case "GROUP_JOINED":
        return {
          icon: UserPlus,
          bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        };
      case "FEEDBACK_SUBMITTED":
        return {
          icon: MessageSquare,
          bg: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
        };
      default:
        return {
          icon: Activity,
          bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
        };
    }
  };

  const renderEventDetails = (event: ActivityEvent) => {
    const meta = event.metadata || {};
    switch (event.action) {
      case "LOGIN":
        return (
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Inicio de sesión
            </span>{" "}
            exitoso en la aplicación.
          </div>
        );
      case "PAGE_VIEW":
        return (
          <div>
            Navegó a la sección{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono">
              {meta.path || "/"}
            </code>
          </div>
        );
      case "PREDICTION_MADE":
      case "PREDICTION_UPDATED":
        return (
          <div>
            Guardó pronósticos de partidos:{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {meta.savedCount || 1} predicciones actualizadas
            </span>
            .
          </div>
        );
      case "PROFILE_UPDATED":
        const updatedFields = Object.entries(meta)
          .filter(([_, val]) => val !== undefined && val !== "")
          .map(([key, val]) => {
            const keyNames: Record<string, string> = {
              displayName: "Nombre",
              nickname: "Usuario",
              country: "País",
              favoriteTeam: "Favorito",
              gender: "Género",
              age: "Edad",
              birthDate: "Nacimiento",
            };
            return `${keyNames[key] || key}: ${val}`;
          })
          .join(", ");
        return (
          <div>
            Actualizó su información de perfil:{" "}
            <span className="text-xs text-slate-550 dark:text-slate-400 italic">
              {updatedFields || "Campos generales"}
            </span>
          </div>
        );
      case "GROUP_CREATED":
        return (
          <div>
            Creó el grupo de Prode{" "}
            <span className="font-semibold text-indigo-650 dark:text-indigo-455">
              {meta.name}
            </span>{" "}
            con el código{" "}
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-700">
              {meta.code}
            </span>
            .
          </div>
        );
      case "GROUP_JOINED":
        return (
          <div>
            Se unió al grupo de Prode{" "}
            <span className="font-semibold text-indigo-650 dark:text-indigo-455">
              {meta.name}
            </span>{" "}
            usando el código{" "}
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-700">
              {meta.code}
            </span>
            .
          </div>
        );
      case "FEEDBACK_SUBMITTED":
        return (
          <div>
            Envió sugerencia / reporte de error:{" "}
            <span className="font-semibold text-slate-850 dark:text-slate-200">
              "{meta.title}"
            </span>{" "}
            en categoría{" "}
            <span className="text-xs px-1.5 py-0.5 bg-slate-105 dark:bg-slate-800 text-slate-600 dark:text-slate-405 rounded capitalize">
              {meta.category}
            </span>
            .
          </div>
        );
      default:
        return <div>Acción registrada: {event.action}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Cargando comportamiento de usuario...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <h2 className="text-xl font-bold text-rose-500">Error</h2>
        <p className="text-slate-500 text-sm">{error || "No se encontró el usuario"}</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Usuarios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-transparent bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 transition-colors shadow-xs"
            title="Volver a la lista de usuarios"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" />
              Estadísticas e Historial
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Análisis completo de interacciones y navegación
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* User selector dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 dark:bg-slate-800 dark:border-transparent rounded-xl px-2.5 py-1.5 shadow-xs">
            <span className="text-xs text-slate-550 dark:text-slate-400 font-bold pl-1 whitespace-nowrap">Analizar:</span>
            <select
              value={uid}
              onChange={(e) => {
                router.push(`/admin/users/${e.target.value}`);
              }}
              className="bg-transparent border-0 text-xs text-slate-800 dark:text-slate-200 font-bold focus:ring-0 focus:outline-none cursor-pointer max-w-[200px]"
            >
              <option value="all" className="dark:bg-slate-800">👥 Todos los Usuarios (Agregado)</option>
              {data?.users && data.users.map((u) => (
                <option key={u.firebaseUid} value={u.firebaseUid} className="dark:bg-slate-800">
                  👤 {u.displayName || u.nickname || "Sin nombre"} ({u.email || "S/D"})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all duration-200 disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar Datos
          </button>
        </div>
      </div>

      {/* User Information Profile Card */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-600/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
              {uid === "all" ? <Users className="w-7 h-7" /> : <User className="w-7 h-7" />}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {data.user.displayName || "Sin nombre"}
                </h2>
                {data.user.nickname && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-md">
                    @{data.user.nickname}
                  </span>
                )}
                {data.user.role === "admin" && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/10 text-rose-650 dark:text-rose-450 rounded-md uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {data.user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {uid === "all" ? "Lanzamiento de plataforma" : `Registrado el ${formatDate(data.user.createdAt)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2.5">
            {data.user.country && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-transparent text-xs font-semibold text-slate-700 dark:text-slate-350 rounded-full shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {data.user.country}
              </span>
            )}
            {data.user.favoriteTeam && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-transparent text-xs font-semibold text-slate-700 dark:text-slate-350 rounded-full shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {data.user.favoriteTeam}
              </span>
            )}
            {data.user.age && (
              <span className="inline-flex items-center px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-transparent text-xs font-semibold text-slate-700 dark:text-slate-350 rounded-full shadow-2xs">
                {data.user.age} años
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - Interactive */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card: Logins */}
        <div
          onClick={() => toggleActionFilter("LOGIN")}
          className={`border rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.97] select-none ${
            selectedActionFilters.includes("LOGIN")
              ? "bg-emerald-550/10 border-emerald-500 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400 scale-[1.01] shadow-sm font-semibold"
              : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
          }`}
          title="Filtrar eventos por inicio de sesión"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5 border border-emerald-500/10">
            <LogIn className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-black block">{data.stats.loginCount}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Logins</span>
        </div>

        {/* Card: Predictions */}
        <div
          onClick={() => toggleActionFilter("PREDICTION_UPDATED")}
          className={`border rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.97] select-none ${
            selectedActionFilters.includes("PREDICTION_UPDATED")
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-500/50 text-amber-800 dark:text-amber-400 scale-[1.01] shadow-sm font-semibold"
              : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
          }`}
          title="Filtrar eventos por predicciones guardadas"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2.5 border border-amber-500/10">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-black block">{data.stats.predictionCount}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Pronósticos</span>
        </div>

        {/* Card: Groups */}
        <div
          onClick={() => toggleActionFilter("GROUP_JOINED")}
          className={`border rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.97] select-none ${
            selectedActionFilters.includes("GROUP_JOINED")
              ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-500/50 text-indigo-850 dark:text-indigo-400 scale-[1.01] shadow-sm font-semibold"
              : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
          }`}
          title="Filtrar eventos por grupos de prode"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2.5 border border-indigo-500/10">
            <UserPlus className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-black block">{data.stats.groupsCount}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Grupos Prode</span>
        </div>

        {/* Card: Feedback */}
        <div
          onClick={() => toggleActionFilter("FEEDBACK_SUBMITTED")}
          className={`border rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.97] select-none ${
            selectedActionFilters.includes("FEEDBACK_SUBMITTED")
              ? "bg-pink-50 dark:bg-pink-950/20 border-pink-400 dark:border-pink-500/50 text-pink-800 dark:text-pink-400 scale-[1.01] shadow-sm font-semibold"
              : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
          }`}
          title="Filtrar eventos por sugerencias enviadas"
        >
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-650 dark:text-pink-400 flex items-center justify-center mx-auto mb-2.5 border border-pink-500/10">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-black block">{data.stats.feedbackCount}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Sugerencias</span>
        </div>

        {/* Card: Page Views */}
        <div
          onClick={() => toggleActionFilter("PAGE_VIEW")}
          className={`border rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.97] col-span-2 md:col-span-1 select-none ${
            selectedActionFilters.includes("PAGE_VIEW")
              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-500/50 text-blue-800 dark:text-blue-400 scale-[1.01] shadow-sm font-semibold"
              : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
          }`}
          title="Filtrar eventos por páginas visitadas"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2.5 border border-blue-500/10">
            <Eye className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-black block">{data.stats.pageViewsCount}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Páginas Vistas</span>
        </div>
      </div>

      {/* Main Section: Daily columns chart */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-indigo-500" />
              Páginas Visitadas a lo Largo del Tiempo
            </h3>
            <p className="text-xs text-slate-500">
              Vistas diarias durante los últimos 30 días
            </p>
          </div>

          {/* Route path pill selector */}
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
            <span className="text-xs text-slate-500 font-medium mr-1">Filtrar página:</span>
            
            {/* Pill: All */}
            <button
              onClick={() => setSelectedPathFilters([])}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer select-none active:scale-[0.95] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedPathFilters.length === 0
                  ? "bg-indigo-650 border-indigo-650 dark:bg-indigo-500 dark:border-indigo-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
              }`}
            >
              Todas
            </button>

            {/* Pills: Individual paths */}
            {data.topPages.map((p) => {
              const isSelected = selectedPathFilters.includes(p.path);
              const pathIdx = uniquePaths.indexOf(p.path);
              const colorDot = PATH_COLORS[pathIdx !== -1 ? pathIdx % PATH_COLORS.length : 0];

              return (
                <button
                  key={p.path}
                  onClick={() => togglePathFilter(p.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer select-none active:scale-[0.95] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs scale-[1.01]"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorDot }} />
                  <span className="font-mono text-[10px]">{p.path || "/"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column Chart */}
        <div className="w-full">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
              onClick={(chartState: any) => {
                if (chartState?.activePayload?.[0]?.payload) {
                  const clickedDate = chartState.activePayload[0].payload.date;
                  setSelectedDateFilter(selectedDateFilter === clickedDate ? null : clickedDate);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtChartDate}
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const payloadDate = payload[0].payload.date;
                    const dateObj = new Date(payloadDate + "T12:00:00");
                    const dateFormatted = dateObj.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });
                    
                    // Filter active paths that have pageviews > 0 on this day
                    const activePaths = payload.filter((p: any) => p.value > 0);
                    const totalViews = activePaths.reduce((sum: number, p: any) => sum + p.value, 0);
                    const isSelected = selectedDateFilter === payloadDate;

                    return (
                      <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl p-4 shadow-xl text-xs text-slate-900 dark:text-white min-w-[200px] space-y-2">
                        <p className="font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-750 pb-1.5">{dateFormatted}</p>
                        {activePaths.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-1">Sin visitas este día</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                             {activePaths.map((p: any) => {
                               const pathIdx = uniquePaths.indexOf(p.name);
                               const solidColor = PATH_COLORS[pathIdx !== -1 ? pathIdx % PATH_COLORS.length : 0];
                               return (
                                 <div key={p.name} className="flex items-center justify-between gap-4">
                                   <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-350 truncate max-w-[155px]">
                                     <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: solidColor }} />
                                     <span className="font-mono text-[10px] truncate">{p.name}</span>
                                   </span>
                                   <span className="font-bold text-slate-900 dark:text-white">{p.value}</span>
                                 </div>
                               );
                             })}
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-750 pt-1.5 font-bold">
                          <span className="text-slate-850 dark:text-slate-250">Total vistas:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 text-sm">{totalViews}</span>
                        </div>
                        <p className="text-[9px] text-slate-450 mt-1 italic pt-1 border-t border-slate-100/50 dark:border-slate-750/50">
                          {isSelected ? "Clic para deseleccionar fecha" : "Clic para filtrar este día"}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {pathsToRender.map((path) => {
                const originalIdx = uniquePaths.indexOf(path);
                const baseColor = PATH_COLORS[originalIdx !== -1 ? originalIdx % PATH_COLORS.length : 0];
                return (
                  <Bar
                    key={path}
                    dataKey={path}
                    stackId="a"
                    name={path || "/"}
                    radius={0}
                  >
                    {chartData.map((entry, index) => {
                      const isDateSelected = selectedDateFilter === entry.date;
                      const opacity = selectedDateFilter
                        ? (isDateSelected ? 1 : 0.25)
                        : 0.85;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={baseColor}
                          fillOpacity={opacity}
                          style={{ transition: "fill-opacity 0.2s ease" }}
                        />
                      );
                    })}
                  </Bar>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center items-center gap-1.5 mt-2 text-[10px] text-slate-550 dark:text-slate-400">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Haz clic en una columna del gráfico para filtrar la línea de tiempo por ese día específico</span>
          </div>
        </div>
      </div>

      {/* Split section: Navigation Breakdown (Left) vs Timeline (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Breakdown (Left) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5 text-slate-450" />
              Páginas Más Frecuentes
            </h4>

            {data.topPages.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                Sin registros de navegación
              </p>
            ) : (
              <div className="space-y-3.5">
                {data.topPages.map((page, idx) => {
                  const maxCount = data.topPages[0]?.count || 1;
                  const percentage = (page.count / maxCount) * 100;
                  const isSelected = selectedPathFilters.includes(page.path);
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePathFilter(page.path)}
                      className={`space-y-2 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] select-none ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-500/50 shadow-sm"
                          : "border-slate-100 dark:border-slate-800/40 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                      title={isSelected ? "Quitar filtro de página" : "Filtrar por esta ruta"}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <code className={`text-[11px] truncate max-w-[220px] font-mono transition-colors ${
                          isSelected ? "text-indigo-650 dark:text-indigo-400 font-extrabold" : "text-slate-655 dark:text-slate-300"
                        }`}>
                          {page.path || "/"}
                        </code>
                        <span className={`transition-colors ${
                          isSelected ? "text-indigo-650 dark:text-indigo-400 font-bold" : "text-slate-500 dark:text-slate-400"
                        }`}>{page.count} visitas</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full rounded-full transition-all ${
                            isSelected ? "bg-indigo-600 dark:bg-indigo-500" : "bg-indigo-500/45 dark:bg-indigo-600/35"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Behavior Timeline (Right) */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-slate-450" />
                Línea de Tiempo de Actividad
              </h4>

              {/* Reset filter badge indicator */}
              {hasAnyFilter && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-650 dark:text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                >
                  <FilterX className="w-3 h-3" />
                  Limpiar Filtros
                </button>
              )}
            </div>

            {/* Filter information panel */}
            {hasAnyFilter && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1">
                <p className="font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider text-[9px]">Filtros activos:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedActionFilters.map((action) => (
                    <span
                      key={action}
                      onClick={() => toggleActionFilter(action)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800/80 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 hover:border-rose-200 transition-colors select-none"
                      title="Haz clic para quitar este filtro"
                    >
                      Acción: {action === "LOGIN" ? "Logins" : action === "PREDICTION_UPDATED" ? "Pronósticos" : action === "GROUP_JOINED" ? "Grupos" : action === "FEEDBACK_SUBMITTED" ? "Sugerencias" : "Páginas"}
                      <span className="text-[10px] opacity-60">×</span>
                    </span>
                  ))}
                  {selectedPathFilters.map((path) => (
                    <span
                      key={path}
                      onClick={() => togglePathFilter(path)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800/80 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 hover:border-rose-200 transition-colors select-none"
                      title="Haz clic para quitar este filtro"
                    >
                      Página: <span className="font-mono">{path}</span>
                      <span className="text-[10px] opacity-60">×</span>
                    </span>
                  ))}
                  {selectedDateFilter && (
                    <span
                      onClick={() => setSelectedDateFilter(null)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800/80 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 hover:border-rose-200 transition-colors select-none"
                      title="Haz clic para quitar este filtro"
                    >
                      Fecha: {fmtChartDate(selectedDateFilter)}
                      <span className="text-[10px] opacity-60">×</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {filteredActivities.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs italic">
                {hasAnyFilter
                  ? "No se encontraron eventos que coincidan con los filtros aplicados."
                  : "No se ha registrado actividad reciente para este usuario."}
              </div>
            ) : (
              <div className="max-h-[550px] overflow-y-auto pr-2 pl-10">
                <div className="relative border-l border-slate-200 dark:border-slate-800/80 pl-6 ml-2 space-y-6 pb-2">
                  {filteredActivities.map((act) => {
                    const config = getEventIcon(act.action);
                    const IconComp = config.icon;
                    return (
                      <div key={act._id} className="relative group">
                        {/* Left marker element */}
                        <span className="absolute -left-[38px] top-0.5 flex items-center justify-center">
                          <span className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${config.bg}`}>
                            <IconComp className="w-4 h-4" />
                          </span>
                        </span>

                        <div className="space-y-1 min-w-0">
                          {uid === "all" && act.user && (
                            <div className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 flex items-center gap-1 mb-0.5 select-none">
                              <span>👤 {act.user.displayName || "Sin nombre"}</span>
                              {act.user.nickname && (
                                <span className="text-slate-400 dark:text-slate-500 font-normal">(@{act.user.nickname})</span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-slate-755 dark:text-slate-200 leading-relaxed pr-2">
                            {renderEventDetails(act)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatDate(act.createdAt)}</span>
                            <span className="text-slate-500">•</span>
                            <span>{getRelativeTime(act.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
