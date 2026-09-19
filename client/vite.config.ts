import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      // Uploaded files are served as static assets by the API
      // (app.use("/uploads", express.static(...))). Without this, a stored
      // "/uploads/documents/x.pdf" link hit Vite instead, fell through to the
      // SPA shell, and rendered the catch-all "Page Not Found" — or bounced to
      // /login, since a new tab has no sessionStorage token.
      "/uploads": "http://localhost:8000",
    },
  },
});
