import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Dynamic plugin loading based on environment
const cartographerPlugin =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
    ? import("@replit/vite-plugin-cartographer").then((m) => m.cartographer())
    : null;

export default defineConfig({
  base: "./", // ✅ This fixes broken styling on Render or other production builds
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(cartographerPlugin ? [cartographerPlugin] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
