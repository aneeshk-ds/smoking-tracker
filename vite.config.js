import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is set by the GitHub Actions workflow to /repo-name/
// Falls back to './' for local dev and preview
const base = process.env.VITE_BASE ?? './'

export default defineConfig({
  plugins: [react()],
  base,
  // Vitest: unit tests live under src/. Playwright E2E lives under e2e/ and is
  // run separately via `npm run test:e2e`, so it is excluded here.
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
