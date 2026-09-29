import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AIRA Skill City",
    short_name: "AIRA Skill City",
    description: "AIRA Skill City learning and operations workspace.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#EB001B",
    orientation: "any",
    categories: ["education", "business", "productivity"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Login", short_name: "Login", url: "/login", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Notifications", short_name: "Notifications", url: "/notifications", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }] }
    ]
  };
}
