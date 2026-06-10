import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cronograma de Partidos",
  description:
    "Consultá la fecha, el horario oficial, la sede y el estadio de todos los partidos del Mundial de Selecciones 2026. Seguí el calendario día a día en vivo.",
  alternates: {
    canonical: "/schedule",
  },
  openGraph: {
    title: "Cronograma de Partidos | Mundial de Selecciones 2026",
    description:
      "Consultá la fecha, el horario oficial, la sede y el estadio de todos los partidos del Mundial de Selecciones 2026. Seguí el calendario día a día en vivo.",
    url: "https://fifa-world-cup-2026.vercel.app/schedule",
    siteName: "Mundial de Selecciones 2026",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mundial de Selecciones 2026 Schedule Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cronograma de Partidos | Mundial de Selecciones 2026",
    description:
      "Consultá la fecha, el horario oficial, la sede y el estadio de todos los partidos del Mundial de Selecciones 2026.",
    images: ["/opengraph-image"],
  },
};

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
