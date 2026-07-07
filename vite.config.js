import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is set by the GitHub Actions workflow to /repo-name/
const base = process.env.VITE_BASE ?? './'

// Unique id per build. Stamped into the app AND emitted as version.json so the
// running app can detect when a newer build has been deployed.
const BUILD_ID = process.env.VITE_BUILD_ID ?? String(Date.now())

function emitVersion(buildId) {
  return {
    name: 'emit-version-json',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), emitVersion(BUILD_ID)],
  base,
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
