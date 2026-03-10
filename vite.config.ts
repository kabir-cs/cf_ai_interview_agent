import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { phosphorIconsCompat } from "./phosphor-icons-compat";

export default defineConfig({
  plugins: [phosphorIconsCompat(), react(), cloudflare(), tailwindcss()],
  optimizeDeps: {
    exclude: ["@phosphor-icons/react"],
  },
});
