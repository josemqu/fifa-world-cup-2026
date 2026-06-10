"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Target,
  Activity,
  ArrowRight,
  Cpu,
  Database,
  ShieldCheck,
  Calendar,
  Zap,
} from "lucide-react";
import Countdown from "@/components/Countdown";

// Animation variants for container cascading
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

// Animation variants for individual items
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-12 md:space-y-16">
      {/* SECTION 1: HERO & COUNTDOWN */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                <span className="mr-1.5 flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Edición Expandida 48 Selecciones
              </span>

              <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Mundial de Selecciones{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  2026
                </span>
              </h1>

              <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Simulá partidos, corré predicciones de Montecarlo con alta precisión
                y competí con tus amigos en la plataforma de Prode. Viví la Copa del Mundo interactiva.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  id="btn-hero-prode"
                  href="/prode"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-sm font-bold shadow-sm transition-colors group cursor-pointer"
                >
                  Jugar al Prode
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  id="btn-hero-fixture"
                  href="/fixture"
                  className="inline-flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 px-5 py-3 text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer"
                >
                  Simular Fixture
                </Link>
                <Link
                  id="btn-hero-predictions"
                  href="/predictions"
                  className="inline-flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 px-5 py-3 text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer"
                >
                  Predicciones Montecarlo
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-400/80 mb-2">
                Faltan para el Kickoff
              </span>
              <Countdown targetDate="2026-06-11T19:00:00Z" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURE GRID */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Explorá las Funcionalidades
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Todo lo necesario para simular, predecir e interactuar con el torneo.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Card 1: Fixture & Simulator */}
          <motion.div
            variants={itemVariants}
            className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-xs flex flex-col justify-between hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="inline-flex p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Fixture Interactivo
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingresá los marcadores de los 104 partidos. La app calcula dinámicamente las posiciones aplicando las reglas de desempate oficiales de la FIFA, incluyendo la tabla comparativa de mejores terceros y el bracket eliminatorio desde R32.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Link
                  href="/fixture?tab=groups"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Fase de Grupos
                </Link>
                <span>•</span>
                <Link
                  href="/fixture?tab=knockout"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Llave de Eliminación
                </Link>
              </div>
              <Link
                href="/fixture"
                className="inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform"
              >
                Simular ahora
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Montecarlo Predictions */}
          <motion.div
            variants={itemVariants}
            className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-xs flex flex-col justify-between hover:border-violet-500/50 dark:hover:border-violet-400/50 transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="inline-flex p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Predicciones Montecarlo
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Corré simulaciones de alta precisión (10.000 iteraciones) para estimar las probabilidades matemáticas de cada selección en cada ronda y explorá la matriz de posibles cruces del torneo.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Link
                  href="/predictions"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Probabilidades
                </Link>
                <span>•</span>
                <Link
                  href="/predictions?tab=matchups"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  Matriz de Cruces
                </Link>
              </div>
              <Link
                href="/predictions"
                className="inline-flex items-center text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform"
              >
                Ver Probabilidades
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </motion.div>

          {/* Card 3: Prode platform */}
          <motion.div
            variants={itemVariants}
            className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="inline-flex p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Plataforma de Prode
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingresá tus pronósticos del mundial para competir. Creá grupos privados con amigos compartiendo un simple código, sumá puntos por acertar ganador o marcador exacto, y escalá en la tabla de posiciones global.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ligas Privadas</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Leaderboard Global</span>
              </div>
              <Link
                href="/prode"
                className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform"
              >
                Crear Grupo
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </motion.div>

          {/* Card 4: Schedule & Live Scores */}
          <motion.div
            variants={itemVariants}
            className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-xs flex flex-col justify-between hover:border-amber-500/50 dark:hover:border-amber-400/50 transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="inline-flex p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Resultados en Vivo y Calendario
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Seguí el transcurso de los partidos reales con actualizaciones al instante. Consultá las fechas, horarios oficiales, sedes y estadios en la pestaña de Cronograma.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Link
                  href="/schedule"
                  className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  Calendario Diario
                </Link>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Sincronización en Vivo</span>
              </div>
              <Link
                href="/schedule"
                className="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform"
              >
                Ver Cronograma
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 3: RULES & SIMULATION METHODOLOGY */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-950/20 p-8 md:p-10 space-y-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-blue-500/[0.03] dark:bg-blue-400/[0.02] blur-3xl" />
        </div>

        <div className="max-w-3xl text-center mx-auto space-y-3 relative z-10">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reglas Oficiales y Metodología
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            El simulador calcula los resultados y posiciones de forma realista siguiendo las normativas vigentes y el nivel actual de cada país.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/30 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                Criterios FIFA Oficiales
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Las posiciones y la clasificación de los mejores terceros se determinan aplicando estrictamente los desempates del reglamento oficial.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/30 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-violet-600 dark:text-violet-400">
              <Cpu className="w-5 h-5 shrink-0" />
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                Simulación de Resultados
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Los goles de los partidos simulados se calculan utilizando el rendimiento histórico y los puntos de clasificación mundial.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/30 p-5 space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5 shrink-0" />
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                Predicciones a tu Medida
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Al cargar tus propios marcadores en el fixture, el simulador adapta sus cálculos para reflejar el impacto de tus pronósticos.
            </p>
          </div>
        </div>

        <div className="text-center relative z-10 pt-2">
          <Link
            href="/predictions"
            className="inline-flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Conocé más sobre la metodología matemática de simulación
          </Link>
        </div>
      </section>
    </div>
  );
}
