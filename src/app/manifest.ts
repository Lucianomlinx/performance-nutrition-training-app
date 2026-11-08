import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "pulso. — Performance & Dossiê Clínico",
    short_name: "pulso.",
    description: "Acompanhamento diário de nutrição esportiva, musculação (ABCAB) e futevôlei.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c1411",
    theme_color: "#0c1411",
    icons: [
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
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
