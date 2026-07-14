import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIBRY Specialist Platform",
    short_name: "AIBRY Specialists",
    description: "A coordinated platform of focused AI specialists with controlled authority and complete accountability.",
    start_url: "/",
    display: "standalone",
    background_color: "#041325",
    theme_color: "#041325",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
