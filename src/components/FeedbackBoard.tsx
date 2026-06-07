"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ThumbsUp,
  Bug,
  Lightbulb,
  Plus,
  Search,
  MessageCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Send,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";

interface FeedbackItem {
  _id: string;
  firebaseUid?: string;
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  title: string;
  content: string;
  category: "suggestion" | "bug" | "idea" | "other";
  status: "pending" | "reviewing" | "planned" | "progress" | "completed" | "rejected";
  upvotes: string[];
  adminResponse?: {
    content: string;
    respondedAt: string;
    respondedBy: string;
  };
  createdAt: string;
  updatedAt: string;
  upvotesCount: number;
}

export default function FeedbackBoard() {
  const { user, dbUser, loginWithGoogle } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Filters and sorting states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");

  // New feedback form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<"suggestion" | "bug" | "idea" | "other">("suggestion");
  const [formError, setFormError] = useState("");

  // Admin response states (keyed by feedback ID)
  const [adminResponseText, setAdminResponseText] = useState<{ [key: string]: string }>({});
  const [adminStatusText, setAdminStatusText] = useState<{ [key: string]: string }>({});
  const [adminSubmitting, setAdminSubmitting] = useState<{ [key: string]: boolean }>({});

  const isAdmin = dbUser?.role === "admin";

  // Fetch feedback from API
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const uidParam = user ? `&uid=${user.uid}` : "";
      const res = await fetch(
        `/api/feedback?category=${categoryFilter}&status=${statusFilter}&sort=${sortOrder}${uidParam}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFeedbacks(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [categoryFilter, statusFilter, sortOrder, user]);

  // Handle new feedback submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      loginWithGoogle();
      return;
    }

    if (!formTitle.trim()) {
      setFormError("Por favor, ingresá un título.");
      return;
    }
    if (!formContent.trim()) {
      setFormError("Por favor, describí tu sugerencia o problema.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          title: formTitle,
          content: formContent,
          category: formCategory,
          authorName: user.displayName || dbUser?.nickname || "Usuario",
          authorPhoto: user.photoURL,
          authorEmail: user.email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Reset form
          setFormTitle("");
          setFormContent("");
          setFormCategory("suggestion");
          setIsFormOpen(false);
          // Refetch items
          fetchFeedback();
        } else {
          setFormError(data.error || "Ocurrió un error.");
        }
      } else {
        setFormError("Error al enviar el feedback. Intentalo de nuevo.");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setFormError("Error de conexión. Intentalo más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle upvoting
  const handleVote = async (feedbackId: string) => {
    if (!user) {
      loginWithGoogle();
      return;
    }

    try {
      setVotingId(feedbackId);
      const res = await fetch("/api/feedback/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          firebaseUid: user.uid,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update item upvotes in state locally for smooth UX
          setFeedbacks((prev) =>
            prev.map((item) => {
              if (item._id === feedbackId) {
                return {
                  ...item,
                  upvotes: data.upvotes,
                  upvotesCount: data.upvotesCount,
                };
              }
              return item;
            })
          );
        }
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVotingId(null);
    }
  };

  // Handle admin actions (status update and official response)
  const handleAdminSubmit = async (feedbackId: string) => {
    if (!user || !isAdmin) return;

    const status = adminStatusText[feedbackId];
    const adminResponse = adminResponseText[feedbackId];

    try {
      setAdminSubmitting((prev) => ({ ...prev, [feedbackId]: true }));
      const res = await fetch("/api/feedback/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          firebaseUid: user.uid,
          status,
          adminResponse,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update item in local state
          setFeedbacks((prev) =>
            prev.map((item) => {
              if (item._id === feedbackId) {
                return {
                  ...item,
                  status: data.data.status,
                  adminResponse: data.data.adminResponse,
                };
              }
              return item;
            })
          );
          // Clear inputs
          setAdminResponseText((prev) => ({ ...prev, [feedbackId]: "" }));
        }
      }
    } catch (error) {
      console.error("Error submitting admin action:", error);
    } finally {
      setAdminSubmitting((prev) => ({ ...prev, [feedbackId]: false }));
    }
  };

  // Initialize admin action inputs when expanding controls
  const initAdminInputs = (item: FeedbackItem) => {
    if (!adminStatusText[item._id]) {
      setAdminStatusText((prev) => ({ ...prev, [item._id]: item.status }));
    }
    if (!adminResponseText[item._id] && item.adminResponse) {
      setAdminResponseText((prev) => ({ ...prev, [item._id]: item.adminResponse?.content || "" }));
    }
  };

  // Filter feedbacks locally based on search query
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.authorName.toLowerCase().includes(q)
    );
  });

  // Category and Status labels mapping
  const categoryLabels = {
    suggestion: { label: "Sugerencia", icon: Lightbulb, color: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400" },
    bug: { label: "Error / Bug", icon: Bug, color: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400" },
    idea: { label: "Idea", icon: Sparkles, color: "text-violet-600 bg-violet-500/10 border-violet-500/20 dark:text-violet-400" },
    other: { label: "Otro", icon: MessageSquare, color: "text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400" },
  };

  const statusLabels = {
    pending: { label: "Pendiente", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    reviewing: { label: "Bajo revisión", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" },
    planned: { label: "Planificado", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400" },
    progress: { label: "En progreso", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400" },
    completed: { label: "Completado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" },
    rejected: { label: "Rechazado", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400" },
  };

  // Calc quick stats
  const totalCount = feedbacks.length;
  const completedCount = feedbacks.filter((f) => f.status === "completed").length;
  const plannedInProgressCount = feedbacks.filter(
    (f) => f.status === "planned" || f.status === "progress"
  ).length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">
      {/* Title block */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm p-8 md:p-12 mb-8">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full border border-blue-200/50 bg-blue-50/50 px-3 py-1 text-xs font-semibold text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 mb-4">
              Comunidad
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Feedback
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Ayudanos a mejorar la aplicación. Dejanos tu sugerencia, reportá errores o votá por las ideas que más te gustaría ver implementadas para el Mundial 2026.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-sm font-bold shadow-sm transition-all duration-200 transform hover:scale-105 shrink-0 gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Sugerencia
          </button>
        </div>
      </div>

      {/* Stats Widget */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Recibido</span>
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {loading ? "..." : totalCount}
            </span>
          </div>
          <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">En Desarrollo</span>
            <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {loading ? "..." : plannedInProgressCount}
            </span>
          </div>
          <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Completados</span>
            <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {loading ? "..." : completedCount}
            </span>
          </div>
        </div>
      )}

      {/* Filters and Search toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6 w-full">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto w-full lg:w-auto p-1 gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 scrollbar-none">
          {[
            { id: "all", label: "Todas" },
            { id: "suggestion", label: "Sugerencias" },
            { id: "bug", label: "Errores" },
            { id: "idea", label: "Ideas" },
            { id: "other", label: "Otros" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold leading-5 text-center focus:outline-none transition-all duration-200 whitespace-nowrap cursor-pointer ${
                categoryFilter === tab.id
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters and search box */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comentarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status select filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="reviewing">En revisión</option>
            <option value="planned">Planificados</option>
            <option value="progress">En progreso</option>
            <option value="completed">Completados</option>
            <option value="rejected">Rechazados</option>
          </select>

          {/* Sort selection */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-700 dark:text-slate-300"
          >
            <option value="popular">Más Votados</option>
            <option value="recent">Más Recientes</option>
          </select>
        </div>
      </div>

      {/* Main Feedback List */}
      {loading ? (
        <div className="flex flex-col gap-4 py-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl p-6 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-12 text-center">
          <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {!user ? "Identificación requerida" : "No se encontraron sugerencias"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {!user
              ? "Para ver tus sugerencias enviadas y votar, por favor iniciá sesión."
              : searchQuery
              ? "Probá ajustando la búsqueda o los filtros para encontrar lo que buscás."
              : "¡No tenés sugerencias creadas aún! Hacé click en 'Nueva Sugerencia' para crear la primera."}
          </p>
          {!user && (
            <button
              onClick={loginWithGoogle}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer"
            >
              Iniciar Sesión con Google
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filteredFeedbacks.map((item) => {
            const hasVoted = user ? item.upvotes.includes(user.uid) : false;
            const CategoryIcon = categoryLabels[item.category]?.icon || MessageSquare;
            const catStyle = categoryLabels[item.category] || categoryLabels.other;
            const statusStyle = statusLabels[item.status] || statusLabels.pending;

            return (
              <motion.article
                key={item._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-5 relative"
              >
                {/* Vote Button Section */}
                <div className="flex md:flex-col items-center justify-between md:justify-center bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 md:py-4 md:px-3.5 shrink-0 self-start md:self-auto gap-2 border border-slate-100 dark:border-slate-900 w-full md:w-16">
                  <span className="text-[10px] md:hidden text-slate-500 font-semibold uppercase tracking-wider">
                    Votar esta idea
                  </span>
                  <div className="flex md:flex-col items-center gap-2 md:gap-1.5">
                    <button
                      onClick={() => handleVote(item._id)}
                      disabled={votingId === item._id}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-all duration-350 transform active:scale-95 cursor-pointer ${
                        hasVoted
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 text-slate-400 dark:text-slate-300"
                      }`}
                      title={hasVoted ? "Quitar voto" : "Votar sugerencia"}
                    >
                      <ThumbsUp
                        className={`w-4 h-4 transition-transform duration-250 ${
                          hasVoted ? "scale-110 fill-white" : "group-hover:scale-110"
                        } ${votingId === item._id ? "animate-pulse" : ""}`}
                      />
                    </button>
                    <span className="text-sm font-black text-slate-900 dark:text-white min-w-[20px] text-center">
                      {item.upvotesCount !== undefined ? item.upvotesCount : item.upvotes.length}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-3">
                  {/* Category and status badge bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${catStyle.color}`}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      {catStyle.label}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold ${statusStyle.color}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>

                  {/* Author information */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {item.authorPhoto ? (
                        <Image
                          src={item.authorPhoto}
                          alt={item.authorName}
                          fill
                          sizes="24px"
                          className="object-cover animate-in fade-in"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 uppercase">
                          {item.authorName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {new Date(item.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Admin official response */}
                  {item.adminResponse && (
                    <div className="mt-4 bg-blue-50/40 dark:bg-slate-950/50 rounded-xl p-4 border border-blue-100/30 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-600" />
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Respuesta Oficial del Administrador
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                        {item.adminResponse.content}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-2 text-right">
                        Respondido por {item.adminResponse.respondedBy} el{" "}
                        {new Date(item.adminResponse.respondedAt).toLocaleDateString(
                          "es-AR"
                        )}
                      </span>
                    </div>
                  )}

                  {/* Admin actions interface (inline) */}
                  {isAdmin && (
                    <div className="mt-4 border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
                      <button
                        onClick={() => initAdminInputs(item)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Moderación del Administrador
                      </button>

                      {adminStatusText[item._id] !== undefined && (
                        <div className="mt-3 space-y-3 bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* Status dropdown */}
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                                Estado sugerencia
                              </label>
                              <select
                                value={adminStatusText[item._id]}
                                onChange={(e) =>
                                  setAdminStatusText((prev) => ({
                                    ...prev,
                                    [item._id]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pendiente</option>
                                <option value="reviewing">Bajo revisión</option>
                                <option value="planned">Planificado</option>
                                <option value="progress">En progreso</option>
                                <option value="completed">Completado</option>
                                <option value="rejected">Rechazado</option>
                              </select>
                            </div>
                          </div>

                          {/* Response text */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                              Respuesta oficial (dejar vacío para borrar)
                            </label>
                            <textarea
                              rows={2}
                              value={adminResponseText[item._id] || ""}
                              onChange={(e) =>
                                setAdminResponseText((prev) => ({
                                  ...prev,
                                  [item._id]: e.target.value,
                                }))
                              }
                              placeholder="Escribí una actualización o respuesta del admin..."
                              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setAdminStatusText((prev) => {
                                  const copy = { ...prev };
                                  delete copy[item._id];
                                  return copy;
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleAdminSubmit(item._id)}
                              disabled={adminSubmitting[item._id]}
                              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                            >
                              {adminSubmitting[item._id] ? "Guardando..." : "Guardar Moderación"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Suggestion Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 z-10 text-slate-900 dark:text-white overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Head */}
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-black tracking-tight">
                    Nueva sugerencia o error
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form body */}
              {!user ? (
                <div className="text-center py-6 flex-1 flex flex-col justify-center">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                  <h4 className="text-sm font-bold">Identificación requerida</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                    Para mantener el feedback constructivo y libre de spam, debés iniciar sesión para enviar sugerencias.
                  </p>
                  <button
                    onClick={() => {
                      loginWithGoogle().then(() => {
                        // Keep open or let context refresh
                      });
                    }}
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-bold shadow-sm transition-all duration-200 transform hover:scale-105 cursor-pointer mx-auto"
                  >
                    Iniciar Sesión con Google
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4 flex-1 overflow-y-auto pr-1">
                  {/* Category selection */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                      Categoría
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "suggestion", label: "Sugerencia", icon: Lightbulb },
                        { id: "bug", label: "Error / Bug", icon: Bug },
                        { id: "idea", label: "Idea", icon: Sparkles },
                        { id: "other", label: "Otro", icon: MessageSquare },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = formCategory === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormCategory(item.id as any)}
                            className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-bold"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] whitespace-nowrap">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                      Título breve (máx. 100 caracteres)
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ej: Agregar historial de campeones por usuario"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                      Detalle de la sugerencia (máx. 1000 caracteres)
                    </label>
                    <textarea
                      rows={5}
                      maxLength={1000}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Explicá en detalle lo que sugerís, o cómo replicar el error detectado..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  {/* Error display */}
                  {formError && (
                    <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-bold shrink-0">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {submitting ? (
                        "Enviando..."
                      ) : (
                        <>
                          Enviar Sugerencia
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
