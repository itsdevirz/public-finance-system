import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    // فشرده‌سازی assets
    assetsInlineLimit: 4096, // فایل‌های زیر ۴KB به base64 تبدیل می‌شوند
    rollupOptions: {
      output: {
        // chunk splitting دستی برای بهترین caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // کتابخانه‌های اصلی React — تغییر کمتر = cache بیشتر
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            // انیمیشن — بزرگ و مستقل
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // آیکون‌ها — بزرگ و نادر تغییر
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Radix UI — مستقل
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            // بقیه node_modules
            return 'vendor';
          }
        },
        // نام‌گذاری با hash برای cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  // بهینه‌سازی esbuild
  esbuild: {
    // حذف console.log در production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  // بهینه‌سازی dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
  },
});
