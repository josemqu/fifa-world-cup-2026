import type { Metadata } from "next";
import FeedbackBoard from "@/components/FeedbackBoard";

export const metadata: Metadata = {
  title: "Feedback | Mundial de Selecciones 2026",
  description:
    "Dejanos tus comentarios, reportá errores o proponé nuevas funcionalidades para mejorar el fixture interactivo y simulador del Mundial 2026.",
  openGraph: {
    title: "Feedback | Mundial de Selecciones 2026",
    description:
      "Dejanos tus comentarios, reportá errores o proponé nuevas funcionalidades para mejorar el fixture interactivo y simulador del Mundial 2026.",
    type: "website",
  },
};

export default function FeedbackPage() {
  return <FeedbackBoard />;
}
