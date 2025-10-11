import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({  
  base: "/aboutfoongdoll/",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {     
      '/api': {
        target: 'http://3.38.237.211:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
})

//  target: 'http://3.38.237.211:8080',
//  target: 'http://localhost:8080',