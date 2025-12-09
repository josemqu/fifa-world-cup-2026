import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fase de Grupos",
  description:
    "Consulta la tabla de posiciones y simula los resultados de la Fase de Grupos del Mundial 2026.",
  openGraph: {
    title: "Fase de Grupos | FIFA World Cup 2026",
    description:
      "Consulta la tabla de posiciones y simula los resultados de la Fase de Grupos del Mundial 2026.",
  },
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
