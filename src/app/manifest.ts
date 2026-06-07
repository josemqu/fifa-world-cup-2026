import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mundial de Selecciones 2026",
    short_name: "Mundial 2026",
    description: "Fixture interactivo y simulador para el Mundial 2026",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e293b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
