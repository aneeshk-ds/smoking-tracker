import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is set by the GitHub Actions workflow to /repo-name/
// Falls back to './' for local dev and preview
const base = process.env.VITE_BASE ?? './'

export default defineConfig({
  plugins: [react()],
  base,
})
