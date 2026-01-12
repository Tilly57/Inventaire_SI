import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }) as any,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 8080,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Radix UI split into smaller chunks for better code splitting
          'ui-dialog-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-alert-dialog',
          ],
          'ui-dropdown-vendor': [
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
          ],
          'ui-form-vendor': [
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
          ],
          'ui-misc-vendor': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],

          // State management and data fetching
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': ['axios', 'date-fns', 'zustand'],

          // Heavy libraries in separate chunks (lazy loaded)
          'charts-vendor': ['recharts'],
          'excel-vendor': ['xlsx'],
          'icons-vendor': ['lucide-react'],
        },
        // Consistent file naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
})
