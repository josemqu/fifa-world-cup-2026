"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Trophy,
  ArrowLeftRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { PredictionComparisonModal } from "@/components/PredictionComparisonModal";
import { AnimatePresence } from "framer-motion";

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
  role?: "user" | "admin";
  loginCount: number;
  lastLoginAt?: string;
  lastActiveAt?: string;
  createdAt: string;
  predictionCount: number;
  excludeFromStats?: boolean;
}

export default function AdminUsersPage() {
  const { dbUser } = useAuth();
  const [allUsers, setAllUsers] = useState<DbUser[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCompareUser, setSelectedCompareUser] = useState<DbUser | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const isProfileComplete = (u: DbUser) => {
    return !!(
      u.displayName &&
      u.nickname &&
      u.country &&
      u.favoriteTeam &&
      u.gender &&
      (u.age || u.birthDate)
    );
  };

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Load saved sorting from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSortBy = window.localStorage.getItem("admin_users_sort_by");
      const savedSortOrder = window.localStorage.getItem("admin_users_sort_order");
      if (savedSortBy) setSortBy(savedSortBy);
      if (savedSortOrder) setSortOrder(savedSortOrder);
    }
  }, []);

  // Save sorting to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin_users_sort_by", sortBy);
      window.localStorage.setItem("admin_users_sort_order", sortOrder);
    }
  }, [sortBy, sortOrder]);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (!dbUser?.email) return;
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      // Fetch all users at once by passing a high limit
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "10000",
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const res = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        headers: { "x-admin-email": dbUser.email },
      });
      const json = await res.json();
      if (json.success) {
        setAllUsers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dbUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(true);
  };

  // Client-side search / filtering
  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return allUsers;
    return allUsers.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.nickname?.toLowerCase().includes(s)
    );
  }, [allUsers, search]);

  // Client-side sorting
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let valA: string | number | boolean | undefined | null;
      let valB: string | number | boolean | undefined | null;

      if (sortBy === "profileComplete") {
        valA = isProfileComplete(a) ? 1 : 0;
        valB = isProfileComplete(b) ? 1 : 0;
      } else {
        valA = a[sortBy as keyof DbUser];
        valB = b[sortBy as keyof DbUser];
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
  }, [filteredUsers, sortBy, sortOrder]);

  const limit = 15;
  const total = sortedUsers.length;
  const pages = Math.ceil(total / limit);

  // Client-side pagination
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedUsers.slice(start, start + limit);
  }, [sortedUsers, page]);

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
      <ChevronUp className="w-3.5 h-3.5 ml-1 inline-block text-indigo-600 dark:text-indigo-400 font-bold" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 inline-block text-indigo-600 dark:text-indigo-400 font-bold" />
    );
  };

  const toggleExcludeFromStats = async (user: DbUser) => {
    if (!dbUser?.email) return;
    try {
      const updatedValue = !user.excludeFromStats;
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": dbUser.email,
        },
        body: JSON.stringify({
          firebaseUid: user.firebaseUid,
          excludeFromStats: updatedValue,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.firebaseUid === user.firebaseUid
              ? { ...u, excludeFromStats: updatedValue }
              : u
          )
        );
      }
    } catch (e) {
      console.error("Error toggling user stats exclusion:", e);
    }
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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los usuarios registrados y analiza sus estadísticas de uso.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all duration-200 disabled:opacity-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, nickname o email..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th
                  onClick={() => handleSort("displayName")}
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Usuario {renderSortIcon("displayName")}
                </th>
                <th
                  onClick={() => handleSort("country")}
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Ubicación {renderSortIcon("country")}
                </th>
                <th
                  onClick={() => handleSort("profileComplete")}
                  className="px-3 py-3 text-center cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Perfil {renderSortIcon("profileComplete")}
                </th>
                <th
                  onClick={() => handleSort("predictionCount")}
                  className="px-3 py-3 text-center cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Preds {renderSortIcon("predictionCount")}
                </th>
                <th
                  onClick={() => handleSort("loginCount")}
                  className="px-3 py-3 text-center cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Sess {renderSortIcon("loginCount")}
                </th>
                <th
                  onClick={() => handleSort("lastActiveAt")}
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Actividad {renderSortIcon("lastActiveAt")}
                </th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Registro {renderSortIcon("createdAt")}
                </th>
                <th
                  onClick={() => handleSort("excludeFromStats")}
                  className="px-3 py-3 text-center cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Stats {renderSortIcon("excludeFromStats")}
                </th>
                <th className="px-3 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-slate-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const completed = isProfileComplete(u);
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Name/Email */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                              {u.displayName || "Sin nombre"}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">
                              {u.email}
                            </p>
                            {u.nickname && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                @{u.nickname}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location & fav team */}
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          {u.country ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                              <span className="truncate max-w-[100px]">{u.country}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-600">-</span>
                          )}
                          {u.favoriteTeam && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <Trophy className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                              <span className="truncate max-w-[100px]">{u.favoriteTeam}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Profile complete status */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex justify-center">
                          {completed ? (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Ok</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Inc</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Prediction count */}
                      <td className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-white">
                        {u.predictionCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-xs">
                            {u.predictionCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Login count */}
                      <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                        {u.loginCount || 0}
                      </td>

                      {/* Last active */}
                      <td className="px-3 py-3 text-xs text-slate-750 dark:text-slate-300">
                        {u.lastActiveAt ? (
                          <span>{formatDate(u.lastActiveAt)}</span>
                        ) : u.lastLoginAt ? (
                          <span>{formatDate(u.lastLoginAt)}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Sign up date */}
                      <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                          <span>{formatDate(u.createdAt)}</span>
                        </div>
                      </td>

                      {/* Stats toggle */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleExcludeFromStats(u)}
                          className={clsx(
                            "inline-flex items-center justify-center p-2 text-xs font-bold rounded-lg transition-all border shadow-xs cursor-pointer",
                            u.excludeFromStats
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          )}
                          title={
                            u.excludeFromStats
                              ? "Excluido de las estadísticas. Haz clic para incluir."
                              : "Incluido en las estadísticas. Haz clic para excluir."
                          }
                        >
                          {u.excludeFromStats ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/users/${u.firebaseUid}`}
                            className="inline-flex items-center justify-center p-2 text-xs font-bold rounded-lg transition-all bg-indigo-600/10 hover:bg-indigo-650 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white border border-indigo-500/20 cursor-pointer"
                            title="Ver comportamiento y estadísticas de uso"
                          >
                            <Activity className="w-4 h-4" />
                          </Link>
                          <button
                            disabled={u.predictionCount === 0 || u.firebaseUid === dbUser?.firebaseUid}
                            onClick={() => setSelectedCompareUser(u)}
                            className={clsx(
                              "inline-flex items-center justify-center p-2 text-xs font-bold rounded-lg transition-all",
                              u.predictionCount > 0 && u.firebaseUid !== dbUser?.firebaseUid
                                ? "bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white border border-blue-500/20 cursor-pointer"
                                : "bg-slate-100 dark:bg-slate-800/40 text-slate-450 dark:text-slate-600 border border-slate-200 dark:border-slate-800/20 cursor-not-allowed"
                            )}
                            title={
                              u.firebaseUid === dbUser?.firebaseUid
                                ? "Eres tú mismo"
                                : u.predictionCount === 0
                                ? "El usuario no tiene pronósticos"
                                : "Comparar pronósticos"
                            }
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              de <span className="text-slate-800 dark:text-slate-350">{total}</span> usuarios
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
      <AnimatePresence>
        {selectedCompareUser && dbUser?.firebaseUid && (
          <PredictionComparisonModal
            isOpen={!!selectedCompareUser}
            onClose={() => setSelectedCompareUser(null)}
            targetUser={selectedCompareUser}
            adminUid={dbUser.firebaseUid}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
