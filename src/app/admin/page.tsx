"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  Globe,
  Trophy,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIs {
  totalUsers: number;
  newUsersToday: number;
  activeToday: number;
  activeThisWeek: number;
  totalPredictions: number;
}

interface ChartData {
  dailyRegistrations: { date: string; count: number }[];
  dailyActiveUsers: { date: string; count: number }[];
  dailyLogins: { date: string; count: number }[];
  activityByType: { action: string; count: number }[];
  topPages: { path: string; count: number }[];
  usersByCountry: { country: string; count: number }[];
  usersByFavoriteTeam: { team: string; count: number }[];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200">
      <div className={`p-3 rounded-xl ${color} shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs text-slate-900 dark:text-white">
        {label && <p className="text-slate-550 dark:text-slate-400 mb-1">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">
            {p.name}: {p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Action name map ──────────────────────────────────────────────────────────

const ACTION_NAMES: Record<string, string> = {
  LOGIN: "Inicios de sesión",
  PAGE_VIEW: "Vistas de página",
  PREDICTION_MADE: "Predicciones creadas",
  PREDICTION_UPDATED: "Predicciones editadas",
  PROFILE_UPDATED: "Perfiles actualizados",
};

// ─── Format date label ────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const [, month, day] = d.split("-");
  return `${day}/${month}`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { dbUser } = useAuth();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!dbUser?.email) return;
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { "x-admin-email": dbUser.email },
      });
      const json = await res.json();
      if (json.success) {
        setKpis(json.data.kpis);
        setCharts(json.data.charts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dbUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Merge daily data for the combo chart
  const mergedDailyData = (() => {
    if (!charts) return [];
    const map = new Map<string, { date: string; registros: number; activos: number; logins: number }>();
    const allDates = new Set([
      ...charts.dailyRegistrations.map((d) => d.date),
      ...charts.dailyActiveUsers.map((d) => d.date),
      ...charts.dailyLogins.map((d) => d.date),
    ]);
    allDates.forEach((date) => {
      map.set(date, { date, registros: 0, activos: 0, logins: 0 });
    });
    charts.dailyRegistrations.forEach((d) => {
      map.get(d.date)!.registros = d.count;
    });
    charts.dailyActiveUsers.forEach((d) => {
      map.get(d.date)!.activos = d.count;
    });
    charts.dailyLogins.forEach((d) => {
      map.get(d.date)!.logins = d.count;
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const activityData = charts?.activityByType.map((d) => ({
    ...d,
    name: ACTION_NAMES[d.action] || d.action,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Estadísticas de la aplicación · últimos 30 días
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all duration-200 disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Users}
            label="Usuarios Totales"
            value={kpis.totalUsers}
            sub="registrados"
            color="bg-indigo-600"
          />
          <StatCard
            icon={UserPlus}
            label="Nuevos Hoy"
            value={kpis.newUsersToday}
            sub="registros de hoy"
            color="bg-emerald-600"
          />
          <StatCard
            icon={Activity}
            label="Activos Hoy"
            value={kpis.activeToday}
            sub="usuarios únicos"
            color="bg-cyan-600"
          />
          <StatCard
            icon={UserCheck}
            label="Activos esta semana"
            value={kpis.activeThisWeek}
            sub="últimos 7 días"
            color="bg-violet-600"
          />
          <StatCard
            icon={Trophy}
            label="Predicciones"
            value={kpis.totalPredictions}
            sub="pronósticos guardados"
            color="bg-amber-600"
          />
        </div>
      )}

      {/* Main area chart */}
      {charts && (
        <ChartCard title="Actividad diaria — Registros, Activos y Logins">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mergedDailyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                formatter={(v) =>
                  v === "registros"
                    ? "Registros"
                    : v === "activos"
                    ? "Activos"
                    : "Logins"
                }
              />
              <Area
                type="monotone"
                dataKey="registros"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gReg)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="activos"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#gAct)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="logins"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gLog)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Second row: Activity by type + Top pages */}
      {charts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activity by type */}
          <ChartCard title="Eventos por tipo (últimos 30 días)">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={activityData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {activityData?.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top pages */}
          <ChartCard title="Páginas más visitadas">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={charts.topPages}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="path"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Visitas" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Third row: Country + Favorite team */}
      {charts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Usuarios por país">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={charts.usersByCountry}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Usuarios" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Equipos favoritos">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={charts.usersByFavoriteTeam}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="team"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Fans" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Empty state for charts */}
      {charts &&
        charts.dailyRegistrations.length === 0 &&
        charts.activityByType.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              Todavía no hay datos de actividad. Los gráficos aparecerán a
              medida que los usuarios utilicen la app.
            </p>
          </div>
        )}
    </div>
  );
}
