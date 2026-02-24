// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  output: 'server',
  security: {
    // We enforce strict origin checks in API handlers with custom logic.
    // Astro's built-in origin check can produce false 403 behind some proxy setups.
    checkOrigin: false
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
