import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "generateSW",
      workbox: {
        // Cache all app shell assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // No runtime caching needed – fully offline, no external APIs
        runtimeCaching: [],
        // Keep clients updated immediately
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        // Enable SW in dev so you can test offline behaviour with `npm run dev`
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "MicroDiary",
        short_name: "MicroDiary",
        description: "Offline-first time-use diary for population research",
        theme_color: "#0d6efd",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
