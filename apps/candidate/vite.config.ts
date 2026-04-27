import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@aiscreener/shared-types": path.resolve(
        __dirname,
        "../../packages/shared-types/src/index.ts"
      ),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/api": "http://localhost:8000",
      "/socket.io": {
        target: "http://localhost:8000",
        ws: true,
      },
    },
  },
});
