import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // The Supabase client is a big dependency and changes rarely, so it
        // gets its own chunk instead of being re-downloaded on every deploy.
        codeSplitting: {
          groups: [{ name: 'supabase', test: /node_modules[\\/]@supabase/ }],
        },
      },
    },
  },
})
