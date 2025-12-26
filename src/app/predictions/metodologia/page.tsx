"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info, Trophy, Target, Dices, Scale } from "lucide-react";
import { clsx } from "clsx";
import { PageTransition } from "@/components/PageTransition";
import { predictWorldCupMatch } from "@/utils/poissonMatchPrediction";
import { BlockMath, InlineMath } from "react-katex";

const KATEX_SETTINGS = { strict: false };

type BarProps = {
  label: string;
  value: number; // 0..1
  leftColorClass: string;
};

function ProbabilityBar({ label, value, leftColorClass }: BarProps) {
  const pct = Math.round(value * 1000) / 10;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium">{label}</span>
        <span className="font-mono">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={clsx("h-full", leftColorClass)}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

type PoissonChartProps = {
  lambda: number;
  title: string;
  colorClass: string;
};

function PoissonChart({ lambda, title, colorClass }: PoissonChartProps) {
  // Simple Poisson PMF for k=0..6 (local, for chart only)
  const factorial = (n: number) => {
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };
  const pmf = (k: number, l: number) => {
    if (l <= 0) return k === 0 ? 1 : 0;
    return (Math.pow(l, k) * Math.exp(-l)) / factorial(k);
  };

  const values = useMemo(() => {
    const raw = Array.from({ length: 7 }, (_, k) => pmf(k, lambda));
    const sum = raw.reduce((a, b) => a + b, 0);
    return sum > 0 ? raw.map((v) => v / sum) : raw;
  }, [lambda]);

  const maxV = Math.max(...values, 1e-9);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          λ = {lambda.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 items-end">
        {values.map((v, k) => (
          <div key={k} className="flex flex-col items-center gap-1">
            <div
              className={clsx("w-full rounded-md", colorClass)}
              style={{
                height: `${Math.max(6, Math.round((v / maxV) * 80))}px`,
              }}
              title={`${k} goles: ${(v * 100).toFixed(1)}%`}
            />
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {k}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Distribución de probabilidad de anotar 0..6 goles.
      </div>
    </div>
  );
}

export default function PredictionsMethodologyPage() {
  const [puntosA, setPuntosA] = useState(1850);
  const [puntosB, setPuntosB] = useState(1750);
  const [hostA, setHostA] = useState(false);
  const [hostB, setHostB] = useState(false);

  const model = useMemo(() => {
    return predictWorldCupMatch({
      puntosA,
      puntosB,
      es_anfitrionA: hostA,
      es_anfitrionB: hostB,
      es_eliminacion_directa: false,
    });
  }, [puntosA, puntosB, hostA, hostB]);

  const knockout = useMemo(() => {
    return predictWorldCupMatch({
      puntosA,
      puntosB,
      es_anfitrionA: hostA,
      es_anfitrionB: hostB,
      es_eliminacion_directa: true,
    });
  }, [puntosA, puntosB, hostA, hostB]);

  return (
    <PageTransition className="max-w-[1600px] mx-auto p-4 md:p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/predictions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Predicciones
          </Link>

          <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
            <Info className="w-3.5 h-3.5" />
            Metodología del modelo
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Cómo estimamos los resultados de los partidos
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
            Este simulador estima probabilidades y marcadores usando una mezcla
            de fuerza relativa (tipo Elo a partir de Puntos FIFA) y un modelo de
            goles basado en Distribución de Poisson. En un Mundial, asumimos
            <span className="font-semibold"> campo neutral</span> por defecto, y
            tratamos al <span className="font-semibold">anfitrión</span> como
            una excepción.
          </p>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Paso 1: Fuerza relativa (We)
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Convertimos la diferencia de Puntos FIFA en una probabilidad
                base de que A sea “más fuerte” que B.
              </p>
              <div className="mt-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-slate-700 dark:text-slate-200 overflow-x-auto">
                <BlockMath
                  math={String.raw`W_e = \frac{1}{10^{-\frac{(P_A - P_B)}{600}} + 1}`}
                  settings={KATEX_SETTINGS}
                />
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Escala 600 = paridad razonable estilo Mundial.
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Paso 2: Goles esperados (λ)
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                En campo neutral, repartimos los goles promedio del partido
                según We.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-slate-700 dark:text-slate-200 overflow-x-auto">
                  <BlockMath
                    math={String.raw`\text{GOLES\_BASE} = 2.6`}
                    settings={KATEX_SETTINGS}
                  />
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-slate-700 dark:text-slate-200 overflow-x-auto">
                  <BlockMath
                    math={String.raw`\lambda_A = \text{GOLES\_BASE} \cdot W_e`}
                    settings={KATEX_SETTINGS}
                  />
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-slate-700 dark:text-slate-200 overflow-x-auto">
                  <BlockMath
                    math={String.raw`\lambda_B = \text{GOLES\_BASE} \cdot (1 - W_e)`}
                    settings={KATEX_SETTINGS}
                  />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Excepción anfitrión: +0.35 a su λ.
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Dices className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Paso 3: Poisson (0..6)
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Con cada λ, calculamos P(goles=k) y armamos una matriz conjunta.
              </p>
              <div className="mt-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-slate-700 dark:text-slate-200 overflow-x-auto">
                <BlockMath
                  math={String.raw`P(k;\lambda) = \frac{\lambda^k e^{-\lambda}}{k!}`}
                  settings={KATEX_SETTINGS}
                />
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                De la matriz sale 1X2 y el marcador exacto más probable.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Demo interactiva (ejemplo)
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Equipo A
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Puntos FIFA</span>
                    <span className="font-mono">{puntosA}</span>
                  </div>
                  <input
                    className="mt-2 w-full"
                    type="range"
                    min={1200}
                    max={2200}
                    step={10}
                    value={puntosA}
                    onChange={(e) => setPuntosA(Number(e.target.value))}
                  />
                  <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={hostA}
                      onChange={(e) => setHostA(e.target.checked)}
                    />
                    A es anfitrión (+0.35 λ)
                  </label>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Equipo B
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Puntos FIFA</span>
                    <span className="font-mono">{puntosB}</span>
                  </div>
                  <input
                    className="mt-2 w-full"
                    type="range"
                    min={1200}
                    max={2200}
                    step={10}
                    value={puntosB}
                    onChange={(e) => setPuntosB(Number(e.target.value))}
                  />
                  <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={hostB}
                      onChange={(e) => setHostB(e.target.checked)}
                    />
                    B es anfitrión (+0.35 λ)
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Salida (Fase de grupos)
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      1X2 + marcador exacto más probable.
                    </div>
                    <div className="space-y-3">
                      <ProbabilityBar
                        label="A gana"
                        value={model.probA}
                        leftColorClass="bg-blue-600"
                      />
                      <ProbabilityBar
                        label="Empate"
                        value={model.probX}
                        leftColorClass="bg-slate-500"
                      />
                      <ProbabilityBar
                        label="B gana"
                        value={model.probB}
                        leftColorClass="bg-fuchsia-600"
                      />
                    </div>

                    <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Marcador exacto más probable
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          P=
                          {Math.round(model.marcadorMasProbable.prob * 1000) /
                            10}
                          %
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {model.marcadorMasProbable.golesA} -{" "}
                        {model.marcadorMasProbable.golesB}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        We={model.we.toFixed(3)} · λA={model.lambdaA.toFixed(2)}{" "}
                        · λB={model.lambdaB.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Salida (Eliminación directa)
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      No hay empate: el empate se resuelve por penales usando
                      We.
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Prob. avanza A
                        </div>
                        <div className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">
                          {((knockout.probAvanzaA ?? 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Prob. avanza B
                        </div>
                        <div className="mt-1 text-xl font-bold text-fuchsia-700 dark:text-fuchsia-300 font-mono">
                          {((knockout.probAvanzaB ?? 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Ganador esperado: {knockout.ganadorEsperado}
                      </div>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        Fórmula:{" "}
                        <InlineMath
                          math={String.raw`P(\text{Avanza\,A}) = P(A) + P(X) \cdot W_e`}
                          settings={KATEX_SETTINGS}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PoissonChart
                  lambda={model.lambdaA}
                  title="Distribución de goles - Equipo A"
                  colorClass="bg-blue-600"
                />
                <PoissonChart
                  lambda={model.lambdaB}
                  title="Distribución de goles - Equipo B"
                  colorClass="bg-fuchsia-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Interpretación rápida
            </h3>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Qué significa We
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Es una probabilidad “base” derivada de los puntos FIFA. No es el
                resultado final: solo guía cómo repartimos los goles esperados.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Campo neutral (Mundial)
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                A diferencia de ligas locales, no hay ventaja de localía por
                defecto. Solo se aplica un bonus si el equipo es anfitrión.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Eliminación directa
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                El modelo permite empates en el tiempo reglamentario, pero
                define un ganador por penales con probabilidad We. La tanda
                simulada respeta el formato 5+5 y muerte súbita.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Nota
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Esto es un modelo estadístico simplificado (no considera
                tácticas, lesiones, ni estilos). Es ideal para simulación y
                comparación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
