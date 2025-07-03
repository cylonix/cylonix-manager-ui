// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'

// Utilities
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
// Please set the following env in .env.local
// - VITE_MANAGER_API_TARGET_URL e.g. http://localhost:8080/
// - VITE_METRICS_TARGET_URL e.g. http://localhost:9090/
// - VITE_WS_TARGET_URL e.g. ws://localhost:8070/
export default ({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  const port: number = parseInt(env.VITE_SERVER_PORT, 10) || 3000

  return defineConfig({
    plugins: [
      Vue({
        template: { transformAssetUrls },
      }),
      // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
      Vuetify(),
      Components(),
      ViteFonts({
        google: {
          families: [{
            name: 'Roboto',
            styles: 'wght@100;300;400;500;700;900',
          }],
        },
      }),
      // @ts-ignore
      monacoEditorPlugin.default({
        //languageWorkers: ['json', 'editorWorkerService']
      })
    ],
    define: { 'process.env': {} },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      extensions: [
        '.js',
        '.json',
        '.jsx',
        '.mjs',
        '.ts',
        '.tsx',
        '.vue',
      ],
    },
    server: {
      port: port,
      proxy: {
        '/manager': {
          target: env.VITE_MANAGER_API_TARGET_URL,
          changeOrigin: true
        },
        '/supervisor': {
          target: env.VITE_MANAGER_API_TARGET_URL,
          changeOrigin: true
        },
        '/vpn/api/v1': {
          target: env.VITE_MANAGER_VPN_API_TARGET_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/vpn/, '')
        },
        '/metrics': {
          target: env.VITE_METRICS_TARGET_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/metrics/, '')
        },
        '/ws': {
          target: env.VITE_WS_TARGET_URL,
          changeOrigin: true,
          ws: true
        }
      },
    }
  })
}
