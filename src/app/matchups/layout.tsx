import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorador de Cruces",
  description:
    "Explorá las probabilidades de enfrentamiento entre selecciones en cada instancia del Mundial 2026. Simulación Monte Carlo con datos de ranking FIFA.",
  openGraph: {
    title: "Explorador de Cruces | Mundial de Selecciones 2026",
    description:
      "¿Contra quién jugará tu selección? Descubrí las probabilidades de cada cruce en el Mundial 2026.",
  },
};

export default function MatchupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
