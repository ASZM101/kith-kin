import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Elysia backend (app/) runs on port 3000 and has no CORS, so the dev
// server forwards the API routes from notes.md to it.
const backend = "http://localhost:3000";
const apiRoutes = ["/login", "/logout", "/question", "/info", "/history", "/profile"];

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(apiRoutes.map(route => [route, backend]))
  }
});
