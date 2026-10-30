import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backend = "http://localhost:3000";
const apiRoutes = ["/login", "/logout", "/question", "/info", "/history", "/spend", "/profile"];

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(apiRoutes.map(route => [route, backend]))
  }
});
