import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fase Final",
  description:
    "Visualiza y simula el cuadro de la Fase Final del Mundial 2026. Octavos de final, cuartos, semifinales y la gran final.",
  openGraph: {
    title: "Fase Final | FIFA World Cup 2026",
    description:
      "Visualiza y simula el cuadro de la Fase Final del Mundial 2026.",
  },
};

export default function KnockoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
