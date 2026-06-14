"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellRing, Check, CheckCheck, X, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

type NotificationItem = {
  _id: string;
  type: "missing_prediction" | "daily_winner" | "general";
  title: string;
  body: string;
  icon?: string;
  link?: string;
  read: boolean;
  sentAt: string;
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function getTypeStyles(type: NotificationItem["type"]) {
  switch (type) {
    case "missing_prediction":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-amber-200/50 dark:border-amber-800/30",
        iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
        dot: "bg-amber-500",
      };
    case "daily_winner":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-200/50 dark:border-emerald-800/30",
        iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
        dot: "bg-emerald-500",
      };
    default:
      return {
        bg: "bg-blue-50 dark:bg-blue-950/20",
        border: "border-blue-200/50 dark:border-blue-800/30",
        iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
        dot: "bg-blue-500",
      };
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const { permission, isSubscribed, subscribe } = usePushNotifications(user?.uid);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Fetch unread count periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/notifications?uid=${user.uid}&limit=1&unreadOnly=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch {
      // Silent fail
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // every 60s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Show push prompt after first load if not subscribed
  useEffect(() => {
    if (user && permission === "default" && !isSubscribed) {
      const dismissed = localStorage.getItem("push_prompt_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowPushPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, permission, isSubscribed]);

  // Fetch full notifications when panel opens
  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?uid=${user.uid}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: user.uid, markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  };

  const handleEnablePush = async () => {
    const success = await subscribe();
    if (success) {
      setShowPushPrompt(false);
    }
  };

  const handleDismissPushPrompt = () => {
    setShowPushPrompt(false);
    localStorage.setItem("push_prompt_dismissed", "true");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className={clsx(
          "relative p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer",
          isOpen
            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
        )}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center"
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-h-[70vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-950/10 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Push Permission Banner */}
            {permission === "default" && !isSubscribed && (
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-100 dark:border-blue-800/30 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <BellRing className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Activá las notificaciones push
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Recibí avisos aunque no tengas la app abierta.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleEnablePush}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                      >
                        Activar
                      </button>
                      <button
                        onClick={handleDismissPushPrompt}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Ahora no
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 px-6">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Sin notificaciones
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Te avisaremos sobre partidos y resultados del prode.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/80 dark:divide-slate-700/30">
                  {notifications.map((notif) => {
                    const styles = getTypeStyles(notif.type);
                    return (
                      <div
                        key={notif._id}
                        className={clsx(
                          "relative px-4 py-3 transition-colors",
                          !notif.read
                            ? `${styles.bg}`
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        {/* Unread indicator */}
                        {!notif.read && (
                          <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                        )}

                        <div className="flex gap-3">
                          {/* Icon */}
                          <div
                            className={clsx(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0 shadow-sm",
                              styles.iconBg
                            )}
                          >
                            {notif.icon || (notif.type === "missing_prediction" ? "⚽" : "🏆")}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={clsx(
                              "text-xs leading-snug",
                              !notif.read
                                ? "font-bold text-slate-900 dark:text-white"
                                : "font-medium text-slate-700 dark:text-slate-300"
                            )}>
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.body}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {timeAgo(notif.sentAt)}
                              </span>
                              {notif.link && (
                                <a
                                  href={notif.link}
                                  onClick={() => setIsOpen(false)}
                                  className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                                >
                                  Ver <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Read indicator */}
                          {notif.read && (
                            <Check className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Push Prompt Toast */}
      <AnimatePresence>
        {showPushPrompt && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <BellRing className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  ¿Querés recibir notificaciones?
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Te avisamos de partidos y resultados del prode.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEnablePush}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
                  >
                    Activar
                  </button>
                  <button
                    onClick={handleDismissPushPrompt}
                    className="px-3 py-1.5 text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                  >
                    No
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissPushPrompt}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
