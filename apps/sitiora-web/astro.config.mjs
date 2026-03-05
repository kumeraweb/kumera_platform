// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  adapter: vercel(),
  output: "server",
  security: {
    // Origin validation is handled in API handlers to support proxy setups.
    checkOrigin: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
