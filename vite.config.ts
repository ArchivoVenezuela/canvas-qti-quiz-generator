import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load environment variables (Vite automatically exposes VITE_* prefixed vars via import.meta.env)
    // No need to manually define them - Vite handles this natively
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Production build optimizations
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false, // Disable sourcemaps for smaller build size
        minify: 'esbuild', // Fast minification
        rollupOptions: {
          output: {
            // Optimize chunk splitting
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
            },
          },
        },
      },
    };
});
