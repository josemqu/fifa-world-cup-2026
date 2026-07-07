"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  UsersRound,
  Calendar,
  Trophy,
  ArrowLeftRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Activity,
  RefreshCw,
  X,
  MapPin,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { PredictionComparisonModal } from "@/components/PredictionComparisonModal";

interface Member {
  firebaseUid: string;
  email: string;
  displayName: string;
  nickname?: string;
  country?: string;
  favoriteTeam?: string;
  predictionCount?: number;
}

interface GroupKPIs {
  totalGroups: number;
  avgMembers: number;
  activeGroups: number;
}

interface EnrichedGroup {
  _id: string;
  name: string;
  code: string;
  ownerUid: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  owner: {
    displayName: string;
    email: string;
    nickname?: string;
  };
  membersList: Member[];
}

export default function AdminGroupsPage() {
  const { dbUser } = useAuth();
  const [allGroups, setAllGroups] = useState<EnrichedGroup[]>([]);
  const [kpis, setKpis] = useState<GroupKPIs | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedGroup, setSelectedGroup] = useState<EnrichedGroup | null>(null);
  const [selectedCompareUser, setSelectedCompareUser] = useState<Member | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<EnrichedGroup | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Load saved sorting from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSortBy = window.localStorage.getItem("admin_groups_sort_by");
      const savedSortOrder = window.localStorage.getItem("admin_groups_sort_order");
      if (savedSortBy) setSortBy(savedSortBy);
      if (savedSortOrder) setSortOrder(savedSortOrder);
    }
  }, []);

  // Save sorting to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin_groups_sort_by", sortBy);
      window.localStorage.setItem("admin_groups_sort_order", sortOrder);
    }
  }, [sortBy, sortOrder]);

  const fetchGroups = useCallback(async () => {
    if (!dbUser?.email) return;
    if (!refreshing) setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "10000",
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const res = await fetch(`/api/admin/groups?${queryParams.toString()}`, {
        headers: { "x-admin-email": dbUser.email },
      });
      const json = await res.json();
      if (json.success) {
        setAllGroups(json.data);
        setKpis(json.kpis);
      }
    } catch (e) {
      console.error("Error fetching prode groups:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dbUser, refreshing]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  // Client-side search / filtering
  const filteredGroups = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return allGroups;
    return allGroups.filter(
      (g) =>
        g.name?.toLowerCase().includes(s) ||
        g.code?.toLowerCase().includes(s) ||
        g.owner?.displayName?.toLowerCase().includes(s) ||
        g.owner?.email?.toLowerCase().includes(s) ||
        g.owner?.nickname?.toLowerCase().includes(s)
    );
  }, [allGroups, search]);

  // Client-side sorting
  const sortedGroups = useMemo(() => {
    const sorted = [...filteredGroups];
    sorted.sort((a, b) => {
      let valA: string | number | undefined | null;
      let valB: string | number | undefined | null;

      if (sortBy === "name") {
        valA = a.name;
        valB = b.name;
      } else if (sortBy === "code") {
        valA = a.code;
        valB = b.code;
      } else if (sortBy === "membersCount") {
        valA = a.membersCount;
        valB = b.membersCount;
      } else if (sortBy === "updatedAt") {
        valA = a.updatedAt;
        valB = b.updatedAt;
      } else {
        valA = a.createdAt;
        valB = b.createdAt;
      }

      if (valA === undefined || valA === null) return sortOrder === "asc" ? 1 : -1;
      if (valB === undefined || valB === null) return sortOrder === "asc" ? -1 : 1;

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "asc"
        ? (valA > valB ? 1 : -1)
        : (valA < valB ? 1 : -1);
    });
    return sorted;
  }, [filteredGroups, sortBy, sortOrder]);

  const limit = 15;
  const total = sortedGroups.length;
  const pages = Math.ceil(total / limit);

  // Client-side pagination
  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedGroups.slice(start, start + limit);
  }, [sortedGroups, page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline-block opacity-40 hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 inline-block text-indigo-650 dark:text-indigo-400 font-bold" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 inline-block text-indigo-650 dark:text-indigo-400 font-bold" />
    );
  };

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

  const handleDeleteGroup = async () => {
    if (!groupToDelete || !dbUser?.email) return;
    if (deleteConfirmCode.trim().toUpperCase() !== groupToDelete.code.toUpperCase()) {
      setDeleteError("El código del grupo no coincide.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/groups?groupId=${groupToDelete._id}`, {
        method: "DELETE",
        headers: { "x-admin-email": dbUser.email },
      });
      const json = await res.json();
      if (json.success) {
        setAllGroups((prev) => prev.filter((g) => g._id !== groupToDelete._id));
        if (kpis) {
          setKpis({
            ...kpis,
            totalGroups: Math.max(0, kpis.totalGroups - 1),
          });
        }
        setGroupToDelete(null);
        setDeleteConfirmCode("");
      } else {
        setDeleteError(json.error || "Error al eliminar el grupo.");
      }
    } catch (e) {
      console.error("Error deleting group:", e);
      setDeleteError("Ocurrió un error inesperado al intentar eliminar el grupo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Grupos de Prode</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analiza y gestiona los grupos cerrados creados por los usuarios en el Prode.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white transition-all duration-200 disabled:opacity-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-indigo-600 text-white shrink-0">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Total Grupos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {kpis.totalGroups.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">creados en el Prode</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-emerald-600 text-white shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Miembros promedio</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {kpis.avgMembers}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">usuarios por grupo</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-amber-600 text-white shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Grupos Activos (7d)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {kpis.activeGroups.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">con cambios recientes</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-550" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre de grupo, código o creador..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-4 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Grupo {renderSortIcon("name")}
                </th>
                <th
                  onClick={() => handleSort("code")}
                  className="px-6 py-4 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Código {renderSortIcon("code")}
                </th>
                <th className="px-6 py-4">Creador (Dueño)</th>
                <th
                  onClick={() => handleSort("membersCount")}
                  className="px-6 py-4 text-center cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Miembros {renderSortIcon("membersCount")}
                </th>
                <th
                  onClick={() => handleSort("updatedAt")}
                  className="px-6 py-4 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Última Actividad {renderSortIcon("updatedAt")}
                </th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="px-6 py-4 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Creado {renderSortIcon("createdAt")}
                </th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Cargando grupos...</p>
                  </td>
                </tr>
              ) : sortedGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron grupos.
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((g) => (
                  <tr key={g._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {g.name}
                    </td>

                    {/* Code */}
                    <td className="px-6 py-4 font-mono text-xs text-slate-650 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {g.code}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-200">
                          {g.owner?.displayName || "Desconocido"}
                        </p>
                        <p className="text-xs text-slate-550 truncate max-w-[170px]">
                          {g.owner?.email}
                        </p>
                      </div>
                    </td>

                    {/* Members Count */}
                    <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-xs">
                        {g.membersCount}
                      </span>
                    </td>

                    {/* Updated At */}
                    <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300">
                      {formatDate(g.updatedAt)}
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-650" />
                        <span>{formatDate(g.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedGroup(g)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/20 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Ver Miembros</span>
                        </button>
                        <button
                          onClick={() => {
                            setGroupToDelete(g);
                            setDeleteConfirmCode("");
                            setDeleteError(null);
                          }}
                          className="inline-flex items-center justify-center p-1.5 text-xs font-bold rounded-lg transition-all bg-rose-600/10 hover:bg-rose-600 text-rose-650 dark:text-rose-450 hover:text-white border border-rose-500/20 cursor-pointer"
                          title="Eliminar Grupo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Mostrando <span className="text-slate-800 dark:text-slate-350">{(page - 1) * limit + 1}</span> a{" "}
              <span className="text-slate-800 dark:text-slate-350">
                {Math.min(page * limit, total)}
              </span>{" "}
              de <span className="text-slate-800 dark:text-slate-350">{total}</span> grupos
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Group Members Modal */}
      <AnimatePresence>
        {selectedGroup && (
          <div className="fixed inset-0 z-45 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Miembros del Grupo</h3>
                    <p className="text-xs text-slate-500">
                      Grupo: <span className="font-semibold text-slate-700 dark:text-slate-350">{selectedGroup.name}</span> · Código: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{selectedGroup.code}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="px-5 py-3">Miembro</th>
                          <th className="px-5 py-3">Ubicación / Equipo</th>
                          <th className="px-5 py-3 text-center">Pronósticos</th>
                          <th className="px-5 py-3 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                        {selectedGroup.membersList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                              Este grupo no tiene miembros.
                            </td>
                          </tr>
                        ) : (
                          selectedGroup.membersList.map((m) => (
                            <tr key={m.firebaseUid} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                                      {m.displayName || "Sin nombre"}
                                    </p>
                                    <p className="text-xs text-slate-555 truncate max-w-[160px]">
                                      {m.email}
                                    </p>
                                    {m.nickname && (
                                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-550 rounded">
                                        @{m.nickname}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="space-y-1 text-xs">
                                  {m.country && (
                                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                      <MapPin className="w-3 h-3 text-slate-450" />
                                      <span>{m.country}</span>
                                    </div>
                                  )}
                                  {m.favoriteTeam && (
                                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                      <Trophy className="w-3 h-3 text-slate-450" />
                                      <span>{m.favoriteTeam}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-center font-semibold text-slate-900 dark:text-white">
                                {m.predictionCount && m.predictionCount > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-xs">
                                    {m.predictionCount}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-650">0</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <button
                                  disabled={!m.predictionCount || m.predictionCount === 0 || m.firebaseUid === dbUser?.firebaseUid}
                                  onClick={() => setSelectedCompareUser(m)}
                                  className={clsx(
                                    "inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    m.predictionCount && m.predictionCount > 0 && m.firebaseUid !== dbUser?.firebaseUid
                                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                                      : "bg-slate-100 dark:bg-slate-800/40 text-slate-450 border border-slate-200 dark:border-slate-800/20 cursor-not-allowed"
                                  )}
                                >
                                  <ArrowLeftRight className="w-3 h-3" />
                                  <span>Comparar</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-b-3xl flex justify-end">
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prediction Comparison Modal */}
      <AnimatePresence>
        {selectedCompareUser && dbUser?.firebaseUid && (
          <PredictionComparisonModal
            isOpen={!!selectedCompareUser}
            onClose={() => setSelectedCompareUser(null)}
            targetUser={{
              _id: "",
              firebaseUid: selectedCompareUser.firebaseUid,
              email: selectedCompareUser.email,
              displayName: selectedCompareUser.displayName,
              nickname: selectedCompareUser.nickname,
              country: selectedCompareUser.country,
              favoriteTeam: selectedCompareUser.favoriteTeam,
              predictionCount: selectedCompareUser.predictionCount || 0,
            }}
            adminUid={dbUser.firebaseUid}
          />
        )}
      </AnimatePresence>

      {/* Delete Group Confirmation Modal */}
      <AnimatePresence>
        {groupToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 border border-rose-500/25 dark:border-rose-900/35 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center border border-rose-500/20 text-rose-600 dark:text-rose-400 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  ¿Eliminar grupo del Prode?
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 px-2">
                  Esta acción eliminará de forma permanente el grupo y retirará a todos sus miembros. No se puede revertir.
                </p>
              </div>

              {/* Group Details Container */}
              <div className="px-6 py-4 mx-6 rounded-2xl bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-800/60 text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-550 dark:text-slate-400">Grupo:</span>
                  <span className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{groupToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550 dark:text-slate-400">Código:</span>
                  <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-300">{groupToDelete.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550 dark:text-slate-400">Creador:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">{groupToDelete.owner?.displayName || "Desconocido"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550 dark:text-slate-400">Miembros:</span>
                  <span className="font-bold text-indigo-650 dark:text-indigo-400">{groupToDelete.membersCount}</span>
                </div>
              </div>

              {/* Input for Confirmation */}
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="confirmCodeInput" className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-2">
                    Para confirmar, escribe el código del grupo (<span className="font-mono text-rose-505 select-all font-bold">{groupToDelete.code}</span>):
                  </label>
                  <input
                    id="confirmCodeInput"
                    type="text"
                    value={deleteConfirmCode}
                    onChange={(e) => {
                      setDeleteConfirmCode(e.target.value);
                      if (deleteError) setDeleteError(null);
                    }}
                    placeholder="Código del grupo"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-center uppercase tracking-wider"
                    disabled={isDeleting}
                  />
                </div>

                {deleteError && (
                  <p className="text-xs font-medium text-rose-650 dark:text-rose-400 text-center bg-rose-500/10 py-2 rounded-xl">
                    {deleteError}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupToDelete(null);
                      setDeleteConfirmCode("");
                      setDeleteError(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-transparent bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    disabled={isDeleting || deleteConfirmCode.trim().toUpperCase() !== groupToDelete.code.toUpperCase()}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Grupo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
