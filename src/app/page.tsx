import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-10 md:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Fixture interactivo y simulador
            </p>

            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              World Cup{" "}
              <span className="text-blue-600 dark:text-blue-400">2026</span>
            </h2>

            <p className="mt-3 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Cargá resultados, seguí las tablas, y mirá cómo se arma el cuadro
              final. Todo en una experiencia simple, rápida y clara.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/groups"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-sm font-bold shadow-sm transition-colors"
              >
                Ir a Fase de Grupos
              </Link>
              <Link
                href="/knockout"
                className="inline-flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 px-5 py-3 text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
              >
                Ver Fase Eliminatoria
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Tabla clara
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Diferencia de gol, goles a favor, criterios y posiciones siempre
            visibles.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Simulación rápida
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Probá escenarios y mirá cómo cambia el cuadro con tus resultados.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Diseño minimalista
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Sin ruido visual: lo importante arriba, y el resto a un click.
          </p>
        </div>
      </section>
    </div>
  );
}
