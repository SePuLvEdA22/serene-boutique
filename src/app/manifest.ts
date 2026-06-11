import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Switch&Tech — Accesorios elegantes",
    short_name: "Switch&Tech",
    description: "Accesorios tecnológicos con estilo. Fundas, cargadores, termos y personalizados.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f5",
    theme_color: "#725856",
    icons: [
      { src: "/icon?192", sizes: "192x192", type: "image/png" },
      { src: "/icon?512", sizes: "512x512", type: "image/png" },
    ],
  };
}
