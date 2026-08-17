import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Node 24 on Windows can terminate while Vite removes an existing output
    // directory. Hashed assets make retaining older local build files harmless,
    // while clean CI/Vercel builds still start with an empty workspace.
    emptyOutDir: false,
  },
})
