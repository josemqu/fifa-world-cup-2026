export type MatchPredictionInput = {
  puntosA: number;
  puntosB: number;
  es_anfitrionA?: boolean;
  es_anfitrionB?: boolean;
  es_eliminacion_directa?: boolean;
};

export type MatchPredictionResult = {
  we: number;
  lambdaA: number;
  lambdaB: number;
  probA: number;
  probX: number;
  probB: number;
  marcadorMasProbable: { golesA: number; golesB: number; prob: number };
  ganadorEsperado: "A" | "B";
  probAvanzaA?: number;
  probAvanzaB?: number;
};

const GOLES_BASE = 2.6;
const HOST_BONUS = 0.35;
const MAX_GOALS = 6;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const factorial = (n: number): number => {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
};

const poissonPMF = (k: number, lambda: number): number => {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const normalize = (arr: number[]): number[] => {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum === 0) return arr.map(() => 0);
  return arr.map((v) => v / sum);
};

export const predictWorldCupMatch = (
  input: MatchPredictionInput
): MatchPredictionResult => {
  const {
    puntosA,
    puntosB,
    es_anfitrionA = false,
    es_anfitrionB = false,
    es_eliminacion_directa = false,
  } = input;

  // Cálculo de Expectativa de Victoria (estilo Elo)
  const weRaw = 1 / (Math.pow(10, -(puntosA - puntosB) / 600) + 1);
  const we = clamp01(weRaw);

  // Campo neutral por defecto
  let lambdaA = GOLES_BASE * we;
  let lambdaB = GOLES_BASE * (1 - we);

  // Excepción: solo si es anfitrión del torneo
  if (es_anfitrionA) lambdaA += HOST_BONUS;
  if (es_anfitrionB) lambdaB += HOST_BONUS;

  // Distribuciones de goles 0..6 (normalizadas para asegurar suma exacta 1 dentro del rango)
  const goalsA = normalize(
    Array.from({ length: MAX_GOALS + 1 }, (_, k) => poissonPMF(k, lambdaA))
  );
  const goalsB = normalize(
    Array.from({ length: MAX_GOALS + 1 }, (_, k) => poissonPMF(k, lambdaB))
  );

  // Matriz conjunta + agregados 1X2
  let probA = 0;
  let probX = 0;
  let probB = 0;

  let best = { golesA: 0, golesB: 0, prob: -1 };

  for (let a = 0; a <= MAX_GOALS; a++) {
    for (let b = 0; b <= MAX_GOALS; b++) {
      const p = goalsA[a] * goalsB[b];

      if (a > b) probA += p;
      else if (a === b) probX += p;
      else probB += p;

      if (p > best.prob) best = { golesA: a, golesB: b, prob: p };
    }
  }

  // Normalización defensiva (por redondeos floating)
  const total = probA + probX + probB;
  if (total !== 0 && Math.abs(total - 1) > 1e-12) {
    probA /= total;
    probX /= total;
    probB /= total;
    best = { ...best, prob: best.prob / total };
  }

  if (!es_eliminacion_directa) {
    const ganadorEsperado: "A" | "B" = probA >= probB ? "A" : "B";
    return {
      we,
      lambdaA,
      lambdaB,
      probA,
      probX,
      probB,
      marcadorMasProbable: best,
      ganadorEsperado,
    };
  }

  // Eliminación directa: no puede haber empate.
  // Si hay empate, definimos avance por penales usando We como probabilidad de avanzar.
  const probAvanzaA = probA + probX * we;
  const probAvanzaB = probB + probX * (1 - we);

  const ganadorEsperado: "A" | "B" = probAvanzaA >= probAvanzaB ? "A" : "B";

  return {
    we,
    lambdaA,
    lambdaB,
    probA,
    probX,
    probB,
    marcadorMasProbable: best,
    ganadorEsperado,
    probAvanzaA,
    probAvanzaB,
  };
};
