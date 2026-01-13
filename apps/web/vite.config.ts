import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression - Phase 4.3
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false,
    }),
    // Brotli compression - Phase 4.3 (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
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
    // Phase 4.3: Keep esbuild for faster builds (terser would require additional config)
    minify: 'esbuild',
    // Phase 4.3: ES2020 target (modern browsers) - better tree-shaking
    target: 'es2020',
    // Phase 4.3: Enable CSS code splitting
    cssCodeSplit: true,
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

          // Phase 4.3: Heavy libraries lazy loaded (not in initial bundle)
          // recharts: Lazy loaded in dashboard only
          // xlsx: Moved to server-side (API endpoint)
          // lucide-react: Tree-shaken automatically by Vite
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
