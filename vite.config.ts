import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'
import { skinMapSyncPlugin } from './dev/skinMapSyncPlugin'

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true }),
    tsconfigPaths(),
    skinMapSyncPlugin()
  ],
  server: {
    port: 3000
  },
  build: {
    manifest: true,
    outDir: 'dist'
  },
  base: '/maple-demage-skin-simulator/'
})
