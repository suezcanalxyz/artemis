import { config as loadEnv } from "dotenv";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

loadEnv({ path: new URL("../../.env", import.meta.url).pathname });

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: __dirname,
  build: {
    outDir: "../../dist/web",
    emptyOutDir: false
  },
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.APP_URL ?? "http://localhost:3000",
      "/uploads": process.env.APP_URL ?? "http://localhost:3000"
    }
  },
  resolve: {
    alias: {
      "@": new URL("../", import.meta.url).pathname,
      "@web": new URL("./src", import.meta.url).pathname
    }
  }
});
