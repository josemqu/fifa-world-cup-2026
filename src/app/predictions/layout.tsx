import type { Metadata } from "next";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Predicciones",
  description:
    "Utiliza nuestra simulación de Montecarlo para predecir las probabilidades de cada equipo de ganar el Mundial 2026.",
  openGraph: {
    title: "Predicciones | World Cup 2026",
    description:
      "Utiliza nuestra simulación de Montecarlo para predecir las probabilidades de cada equipo de ganar el Mundial 2026.",
  },
};

export default function PredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
