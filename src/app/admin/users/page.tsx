"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { clsx } from "clsx";
import { PredictionComparisonModal } from "@/components/PredictionComparisonModal";

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
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminUsersPage() {
  const { dbUser } = useAuth();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCompareUser, setSelectedCompareUser] = useState<DbUser | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    if (!dbUser?.email) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search: debouncedSearch,
      });
      const res = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        headers: { "x-admin-email": dbUser.email },
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dbUser, page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    } catch (e) {
      return "-";
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuarios</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona los usuarios registrados y analiza sus estadísticas de uso.
        </p>
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
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Ubicación / Favorito</th>
                <th className="px-6 py-4 text-center">Perfil</th>
                <th className="px-6 py-4 text-center">Predicciones</th>
                <th className="px-6 py-4 text-center">Sesiones</th>
                <th className="px-6 py-4">Última Actividad</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const completed = isProfileComplete(u);
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Name/Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                              {u.displayName || "Sin nombre"}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-[180px]">
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
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {u.country ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                              <span>{u.country}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-600">-</span>
                          )}
                          {u.favoriteTeam && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <Trophy className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                              <span>{u.favoriteTeam}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Profile complete status */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {completed ? (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Completo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Incompleto</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Prediction count */}
                      <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">
                        {u.predictionCount > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-xs">
                            {u.predictionCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">0</span>
                        )}
                      </td>

                      {/* Login count */}
                      <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                        {u.loginCount || 0}
                      </td>

                      {/* Last active */}
                      <td className="px-6 py-4 text-xs text-slate-750 dark:text-slate-300">
                        {u.lastActiveAt ? (
                          <span>{formatDate(u.lastActiveAt)}</span>
                        ) : u.lastLoginAt ? (
                          <span>{formatDate(u.lastLoginAt)}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Sign up date */}
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                          <span>{formatDate(u.createdAt)}</span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={u.predictionCount === 0 || u.firebaseUid === dbUser?.firebaseUid}
                          onClick={() => setSelectedCompareUser(u)}
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                            u.predictionCount > 0 && u.firebaseUid !== dbUser?.firebaseUid
                              ? "bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white border border-indigo-500/20 cursor-pointer"
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
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Comparar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Mostrando <span className="text-slate-800 dark:text-slate-350">{(page - 1) * pagination.limit + 1}</span> a{" "}
              <span className="text-slate-800 dark:text-slate-350">
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{" "}
              de <span className="text-slate-800 dark:text-slate-350">{pagination.total}</span> usuarios
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
                disabled={page === pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {selectedCompareUser && dbUser?.firebaseUid && (
        <PredictionComparisonModal
          isOpen={!!selectedCompareUser}
          onClose={() => setSelectedCompareUser(null)}
          targetUser={selectedCompareUser}
          adminUid={dbUser.firebaseUid}
        />
      )}
    </div>
  );
}
