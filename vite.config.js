import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: "treat-src-js-as-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (id.includes("node_modules")) return null;
        const normalized = id.replace(/\\/g, "/");
        if (!/\/src\/.*\.js$/.test(normalized)) return null;
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
      },
    },
    react({ include: /\.(js|jsx|ts|tsx)$/ }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://sassbackend.reachableads.com",
        changeOrigin: true,
      },
    },
  },
});
