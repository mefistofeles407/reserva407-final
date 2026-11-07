import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const proxy = { '/Reserva407': 'http://127.0.0.1:80' }
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    proxy,
    cors: false,
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem}', '**/.git/**',
        '**/[bB][aA][cC][kK][eE][nN][dD]/**',
        '**/[dD][aA][tT][aA][bB][aA][sS][eE]/**',
      ],
    },
  },
  preview: { host: '127.0.0.1', proxy },
})
