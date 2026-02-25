// @ts-check
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  security: {
    // We enforce our own origin checks in src/pages/api/contact.ts.
    // Disable Astro's form-origin guard to avoid false positives with www/apex redirects.
    checkOrigin: false
  },

  vite: {
    plugins: [tailwindcss()]
  }
})
