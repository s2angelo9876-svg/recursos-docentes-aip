import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function copyFontAwesomeFonts() {
  return {
    name: 'copy-fa-fonts',
    apply: 'build',
    closeBundle() {
      const src = resolve(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts')
      const dest = resolve(__dirname, 'dist/webfonts')
      mkdirSync(dest, { recursive: true })
      for (const file of readdirSync(src)) {
        if (file.endsWith('.woff2')) {
          copyFileSync(resolve(src, file), resolve(dest, file))
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyFontAwesomeFonts()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
            return 'react-vendor';
          }
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('lucide-react')) return 'icons';
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        proxyTimeout: 8000,
        timeout: 8000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.code === 'ECONNREFUSED') {
              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Servidor iniciando, reintenta en unos segundos.' }));
              }
            }
          });
        },
      },
    }
  }
})
