import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), checker({ typescript: true }), tsconfigPaths()],
  server: {
    port: 3000
  },
  build: {
    manifest: true,
    outDir: 'build'
  },
  base: '/maple-demage-skin-simulator/'
})
