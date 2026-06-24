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
  LineChart,
  Line,
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
  const [accuracy, setAccuracy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [includeAdmins, setIncludeAdmins] = useState(false);

  const fetchData = useCallback(async () => {
    if (!dbUser?.email) return;
    try {
      const res = await fetch(`/api/admin/analytics?includeAdmins=${includeAdmins}`, {
        headers: { "x-admin-email": dbUser.email },
      });
      const json = await res.json();
      if (json.success) {
        setKpis(json.data.kpis);
        setCharts(json.data.charts);
        setAccuracy(json.data.accuracy || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dbUser, includeAdmins]);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Estadísticas de la aplicación · últimos 30 días
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAdmins}
              onChange={(e) => setIncludeAdmins(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-600"
            />
            Incluir admins
          </label>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all duration-200 disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
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

      {/* Main daily activity chart */}
      {charts && (
        <ChartCard title="Actividad diaria — Registros, Activos y Logins">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mergedDailyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
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
              <Bar
                dataKey="registros"
                name="registros"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="activos"
                name="activos"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="logins"
                name="logins"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
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

      {/* ── Accuracy Section (Model vs Community) ─────────────────────────────────── */}
      {accuracy && (
        <div className="space-y-6">
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Comparativa de Acierto (Accuracy): Modelo vs. Comunidad
            </h2>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
              Análisis comparativo de predicciones correctas sobre {accuracy.summary.totalFinishedMatches} partidos finalizados
            </p>
          </div>

          {accuracy.summary.totalFinishedMatches > 0 ? (
            <>
              {/* KPI Comparison Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Outcome KPI Comparison */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                      Acierto de Ganador (Outcome 1X2)
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal mb-4">
                      Porcentaje de predicciones que acertaron el resultado general (Local, Empate o Visitante).
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Modelo</span>
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        {accuracy.summary.model.outcomeAccuracy.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        ({accuracy.summary.model.correctOutcomes} / {accuracy.summary.totalFinishedMatches} part.)
                      </span>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Comunidad</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {accuracy.summary.users.outcomeAccuracy.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        ({accuracy.summary.users.correctOutcomes} / {accuracy.summary.totalUserPredictions} pron.)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score KPI Comparison */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded bg-violet-500" />
                      Acierto de Marcador Exacto (Score)
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal mb-4">
                      Porcentaje de predicciones que acertaron la cantidad exacta de goles de ambos equipos.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Modelo</span>
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        {accuracy.summary.model.scoreAccuracy.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        ({accuracy.summary.model.correctScores} / {accuracy.summary.totalFinishedMatches} part.)
                      </span>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Comunidad</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {accuracy.summary.users.scoreAccuracy.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        ({accuracy.summary.users.correctScores} / {accuracy.summary.totalUserPredictions} pron.)
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Charts comparing accuracy by stage */}
              {accuracy.byStage && accuracy.byStage.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Outcome Accuracy by Stage Line Chart */}
                  <ChartCard title="Acierto de Ganador (1X2) por Etapa del Torneo (%)">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={accuracy.byStage} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis 
                          dataKey="stageName" 
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          unit="%" 
                          domain={[0, 100]}
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs text-slate-900 dark:text-white">
                                  <p className="font-bold text-slate-400 mb-1">{payload[0].payload.stageName}</p>
                                  <p className="text-[10px] text-slate-500 mb-1.5">Partidos: {payload[0].payload.totalMatches}</p>
                                  <p className="text-indigo-500 font-bold">Modelo: {payload[0].value.toFixed(1)}%</p>
                                  <p className="text-emerald-500 font-bold">Comunidad: {payload[1].value.toFixed(1)}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line 
                          type="monotone" 
                          dataKey="modelOutcomeAcc" 
                          name="Modelo" 
                          stroke="#6366f1" 
                          strokeWidth={3} 
                          activeDot={{ r: 6 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="usersOutcomeAcc" 
                          name="Comunidad" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {/* Score Accuracy by Stage Line Chart */}
                  <ChartCard title="Acierto de Marcador Exacto por Etapa del Torneo (%)">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={accuracy.byStage} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis 
                          dataKey="stageName" 
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          unit="%" 
                          domain={[0, 100]}
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs text-slate-900 dark:text-white">
                                  <p className="font-bold text-slate-400 mb-1">{payload[0].payload.stageName}</p>
                                  <p className="text-[10px] text-slate-500 mb-1.5">Partidos: {payload[0].payload.totalMatches}</p>
                                  <p className="text-indigo-500 font-bold">Modelo: {payload[0].value.toFixed(1)}%</p>
                                  <p className="text-emerald-500 font-bold">Comunidad: {payload[1].value.toFixed(1)}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line 
                          type="monotone" 
                          dataKey="modelScoreAcc" 
                          name="Modelo" 
                          stroke="#8b5cf6" 
                          strokeWidth={3} 
                          activeDot={{ r: 6 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="usersScoreAcc" 
                          name="Comunidad" 
                          stroke="#06b6d4" 
                          strokeWidth={3} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-slate-500 dark:text-slate-400">
              <p className="text-xs font-semibold">Aún no hay partidos finalizados en el fixture.</p>
              <p className="text-[11px] mt-1 text-slate-400 leading-normal max-w-md mx-auto">
                Las métricas comparativas del acierto (ganador y marcador exacto) entre el modelo matemático y los pronósticos de los usuarios se calcularán en tiempo real a medida que terminen los partidos.
              </p>
            </div>
          )}
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
