import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Cada publicación en Netlify lleva un número de versión distinto. La app lo compara con /version.json
// para darse cuenta sola de que hay una versión nueva (ver src/lib/useNewVersion.ts).
const BUILD_ID = process.env.COMMIT_REF?.slice(0, 7) || String(Date.now())

function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: BUILD_ID }) })
    },
  }
}

export default defineConfig({
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
})
