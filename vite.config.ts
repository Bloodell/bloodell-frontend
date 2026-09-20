import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O proxy faz o navegador enxergar API e interface na MESMA origem durante o
// desenvolvimento. Com isso, o dia a dia nao depende de CORS -- e o CORS do
// backend continua configurado para o caso de as origens serem diferentes no
// deploy.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
