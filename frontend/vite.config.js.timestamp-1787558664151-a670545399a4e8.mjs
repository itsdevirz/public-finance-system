// vite.config.js
import path from "path";
import { defineConfig } from "file:///C:/Users/Alireza/Downloads/public-finance-system-updated/public-finance-system/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Alireza/Downloads/public-finance-system-updated/public-finance-system/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Alireza\\Downloads\\public-finance-system-updated\\public-finance-system\\frontend";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    // فشرده‌سازی assets
    assetsInlineLimit: 4096,
    // فایل‌های زیر ۴KB به base64 تبدیل می‌شوند
    rollupOptions: {
      output: {
        // chunk splitting دستی برای بهترین caching
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("react")) {
              return "vendor-react";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            return "vendor";
          }
        },
        // نام‌گذاری با hash برای cache busting
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  // بهینه‌سازی esbuild
  esbuild: {
    // حذف console.log در production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : []
  },
  // بهینه‌سازی dependency pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "framer-motion",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBbGlyZXphXFxcXERvd25sb2Fkc1xcXFxwdWJsaWMtZmluYW5jZS1zeXN0ZW0tdXBkYXRlZFxcXFxwdWJsaWMtZmluYW5jZS1zeXN0ZW1cXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFsaXJlemFcXFxcRG93bmxvYWRzXFxcXHB1YmxpYy1maW5hbmNlLXN5c3RlbS11cGRhdGVkXFxcXHB1YmxpYy1maW5hbmNlLXN5c3RlbVxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQWxpcmV6YS9Eb3dubG9hZHMvcHVibGljLWZpbmFuY2Utc3lzdGVtLXVwZGF0ZWQvcHVibGljLWZpbmFuY2Utc3lzdGVtL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNTAwLFxuICAgIC8vIFx1MDY0MVx1MDYzNFx1MDYzMVx1MDYyRlx1MDY0N1x1MjAwQ1x1MDYzM1x1MDYyN1x1MDYzMlx1MDZDQyBhc3NldHNcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NiwgLy8gXHUwNjQxXHUwNjI3XHUwNkNDXHUwNjQ0XHUyMDBDXHUwNjQ3XHUwNjI3XHUwNkNDIFx1MDYzMlx1MDZDQ1x1MDYzMSBcdTA2RjRLQiBcdTA2MjhcdTA2NDcgYmFzZTY0IFx1MDYyQVx1MDYyOFx1MDYyRlx1MDZDQ1x1MDY0NCBcdTA2NDVcdTA2Q0NcdTIwMENcdTA2MzRcdTA2NDhcdTA2NDZcdTA2MkZcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gY2h1bmsgc3BsaXR0aW5nIFx1MDYyRlx1MDYzM1x1MDYyQVx1MDZDQyBcdTA2MjhcdTA2MzFcdTA2MjdcdTA2Q0MgXHUwNjI4XHUwNjQ3XHUwNjJBXHUwNjMxXHUwNkNDXHUwNjQ2IGNhY2hpbmdcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgLy8gXHUwNkE5XHUwNjJBXHUwNjI3XHUwNjI4XHUwNjJFXHUwNjI3XHUwNjQ2XHUwNjQ3XHUyMDBDXHUwNjQ3XHUwNjI3XHUwNkNDIFx1MDYyN1x1MDYzNVx1MDY0NFx1MDZDQyBSZWFjdCBcdTIwMTQgXHUwNjJBXHUwNjNBXHUwNkNDXHUwNkNDXHUwNjMxIFx1MDZBOVx1MDY0NVx1MDYyQVx1MDYzMSA9IGNhY2hlIFx1MDYyOFx1MDZDQ1x1MDYzNFx1MDYyQVx1MDYzMVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcmVhY3QnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXJlYWN0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFx1MDYyN1x1MDY0Nlx1MDZDQ1x1MDY0NVx1MDZDQ1x1MDYzNFx1MDY0NiBcdTIwMTQgXHUwNjI4XHUwNjMyXHUwNjMxXHUwNkFGIFx1MDY0OCBcdTA2NDVcdTA2MzNcdTA2MkFcdTA2NDJcdTA2NDRcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLW1vdGlvbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBcdTA2MjJcdTA2Q0NcdTA2QTlcdTA2NDhcdTA2NDZcdTIwMENcdTA2NDdcdTA2MjcgXHUyMDE0IFx1MDYyOFx1MDYzMlx1MDYzMVx1MDZBRiBcdTA2NDggXHUwNjQ2XHUwNjI3XHUwNjJGXHUwNjMxIFx1MDYyQVx1MDYzQVx1MDZDQ1x1MDZDQ1x1MDYzMVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1pY29ucyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSYWRpeCBVSSBcdTIwMTQgXHUwNjQ1XHUwNjMzXHUwNjJBXHUwNjQyXHUwNjQ0XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeC11aScpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXJhZGl4JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFx1MDYyOFx1MDY0Mlx1MDZDQ1x1MDY0NyBub2RlX21vZHVsZXNcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFx1MDY0Nlx1MDYyN1x1MDY0NVx1MjAwQ1x1MDZBRlx1MDYzMFx1MDYyN1x1MDYzMVx1MDZDQyBcdTA2MjhcdTA2MjcgaGFzaCBcdTA2MjhcdTA2MzFcdTA2MjdcdTA2Q0MgY2FjaGUgYnVzdGluZ1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nLFxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gXHUwNjI4XHUwNjQ3XHUwNkNDXHUwNjQ2XHUwNjQ3XHUyMDBDXHUwNjMzXHUwNjI3XHUwNjMyXHUwNkNDIGVzYnVpbGRcbiAgZXNidWlsZDoge1xuICAgIC8vIFx1MDYyRFx1MDYzMFx1MDY0MSBjb25zb2xlLmxvZyBcdTA2MkZcdTA2MzEgcHJvZHVjdGlvblxuICAgIGRyb3A6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgPyBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSA6IFtdLFxuICB9LFxuICAvLyBcdTA2MjhcdTA2NDdcdTA2Q0NcdTA2NDZcdTA2NDdcdTIwMENcdTA2MzNcdTA2MjdcdTA2MzJcdTA2Q0MgZGVwZW5kZW5jeSBwcmUtYnVuZGxpbmdcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ2F4aW9zJyxcbiAgICAgICdmcmFtZXItbW90aW9uJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgJ2Nsc3gnLFxuICAgICAgJ3RhaWx3aW5kLW1lcmdlJyxcbiAgICBdLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFjLE9BQU8sVUFBVTtBQUN0ZCxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFGbEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsSUFDZCx1QkFBdUI7QUFBQTtBQUFBLElBRXZCLG1CQUFtQjtBQUFBO0FBQUEsSUFDbkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsUUFFTixhQUFhLElBQUk7QUFDZixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFFL0IsZ0JBQUksR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQzNELHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEdBQUc7QUFDeEIscUJBQU87QUFBQSxZQUNUO0FBRUEsZ0JBQUksR0FBRyxTQUFTLGVBQWUsR0FBRztBQUNoQyxxQkFBTztBQUFBLFlBQ1Q7QUFFQSxnQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLHFCQUFPO0FBQUEsWUFDVDtBQUVBLGdCQUFJLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDNUIscUJBQU87QUFBQSxZQUNUO0FBRUEsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBO0FBQUEsUUFFQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFNBQVM7QUFBQTtBQUFBLElBRVAsTUFBTSxRQUFRLElBQUksYUFBYSxlQUFlLENBQUMsV0FBVyxVQUFVLElBQUksQ0FBQztBQUFBLEVBQzNFO0FBQUE7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
