import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CRA used JSX inside .js files. Vite 8/Oxc treats .js as plain JS, so we
 * pre-transform src/*.js with lang: 'jsx' before the default pipeline.
 */
function jsxInJsPlugin() {
  return {
    name: 'jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      const cleanId = id.split('?')[0].replace(/\\/g, '/');
      if (
        !cleanId.endsWith('.js') ||
        cleanId.includes('/node_modules/') ||
        !cleanId.includes('/src/')
      ) {
        return null;
      }
      // Skip files that clearly have no JSX
      if (!code.includes('<')) {
        return null;
      }

      return transformWithOxc(code, cleanId, {
        lang: 'jsx',
        jsx: {
          runtime: 'automatic',
        },
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react({
      include: /\.(js|jsx|ts|tsx)$/,
    }),
    jsxInJsPlugin(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  publicDir: 'public',
});
