import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/Fiolegalr.ico"],
      manifest: {
        name: "Fiolegalr出席",
        short_name: "Fiolegalr",
        description: "Fiolegalr/出欠用アプリ",
        theme_color: "#2e80ff",
        icons: [
          {
            src: "Fiolegalr-192.jpg",
            sizes: "192x192",
            type: "image/jpg",
          },
          {
            src: "Fiolegalr-512.jpg",
            sizes: "512x512",
            type: "image/jpg",
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "dist",
  },
});
