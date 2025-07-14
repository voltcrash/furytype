import { defineConfig } from 'vite';

export default defineConfig({
  // Ensure the build outputs to dist folder
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // Handle public assets properly  
  publicDir: 'public',
  // Ensure proper base path for deployment
  base: './',
}); 