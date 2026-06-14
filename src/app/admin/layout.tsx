"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Usuarios",
    icon: Users,
  },
  {
    href: "/admin/groups",
    label: "Grupos",
    icon: UsersRound,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dbUser, loading, dbLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && !dbLoading) {
      if (!dbUser || dbUser.role !== "admin") {
        router.replace("/");
      }
    }
  }, [dbUser, loading, dbLoading, router]);

  if (loading || dbLoading || !dbUser || dbUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 flex flex-col">
        {/* Navigation Tabs Selector */}
        <div className="flex p-1 gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-sm shadow-inner border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-max">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "text-blue-600 dark:text-blue-100 font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {isActive && mounted && (
                  <motion.div
                    layoutId="adminSubTab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
