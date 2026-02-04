// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
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
      Components({
        exclude: ['**/heavy/**'],
      }),
      ViteFonts({
        google: {
          families: [{
            name: 'Roboto',
            styles: 'wght@100;300;400;500;700;900',
          }],
        },
      }),
      {
        name: 'strip-heavy-preload',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            // Remove preloads for heavy chunks and codicon font
            // Keep vuetify and vendor - they're needed for UI
            return html
              .replace(
                /\s*<link\s+[^>]*href="[^"]*(monaco|heavy)-[^"]*"[^>]*>/g,
                ''
              )
              .replace(
                /\s*<link\s+[^>]*codicon[^>]*>/g,
                ''
              )
          },
        },
      },
      {
        name: 'strip-heavy-deps',
        enforce: 'post',
        async closeBundle() {
          const fs = await import('fs/promises')
          const path = await import('path')
          const outDir = 'dist/assets'

          try {
            const files = await fs.readdir(outDir)
            for (const file of files) {
              if (file.endsWith('.js')) {
                const filePath = path.join(outDir, file)
                let code = await fs.readFile(filePath, 'utf8')
                const before = code.length

                // Remove bare side-effect imports from entry chunks
                // These are CSS side-effect imports that load monaco/heavy CSS on every page
                code = code.replace(
                  /import"\.\/(?:monaco|heavy)-[^"]+\.js";?/g,
                  ''
                )
                // DO NOT remove symbol imports - they're needed for code to work
                // DO NOT remove CSS from mapDeps - monaco needs its CSS to render properly

                // Patch __vite__mapDeps to filter out empty strings (in case any were added)
                // Original: i.map(i=>d[i])
                // Patched: i.map(i=>d[i]).filter(Boolean)
                code = code.replace(
                  /i\.map\(i=>d\[i\]\)/g,
                  'i.map(i=>d[i]).filter(Boolean)'
                )

                if (code.length !== before) {
                  await fs.writeFile(filePath, code)
                  console.log(`Stripped from ${file}: ${before - code.length} bytes`)
                }
              }
            }
          } catch (e) {
            console.error('Error in strip-heavy-deps:', e)
          }
        },
      },
      {
        name: 'trace-importers',
        buildEnd() {
          const targetId = env.VITE_BUILD_TRACE_TARGET_ID // Text to match in the file path
          if (!targetId) {
            return
          }
          const moduleIds = Array.from(this.getModuleIds())

          console.log('\n=== SEARCHING FOR IMPORTERS ===')

          moduleIds.forEach((id) => {
            if (id.includes(targetId)) {
              const info = this.getModuleInfo(id)
              if (info.importers.length > 0) {
                console.log(`\n📦 File: ${id}`)
                console.log('   Imported by:')
                info.importers.forEach(importer => {
                  if (importer.includes('node_modules')) return // Skip node_modules importers
                  console.log(`   -> ${importer}`)
                })
              }
            }
          })
          console.log('=================================\n')
        }
      }
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/monaco-editor')) {
              return 'monaco' // Put Monaco in its own file
            }
            if (id.includes('node_modules/vuetify')) {
              return 'vuetify' // Put Vuetify in its own file
            }
            if (id.includes('node_modules')) {
              return 'vendor' // All other libs
            }
            // Put plugin-vue runtime helpers in common to avoid them ending up in heavy
            if (id.includes('plugin-vue:export-helper')) {
              return 'common'
            }
            if (
              id.includes('src/clients/') ||
              id.includes('src/plugins/') ||
              id.includes('src/stores/') ||
              id.includes('src/utils/') ||
              id.includes('src/composables/')
            ) {
              return 'common'
            }
            if (id.includes('src/heavy/')) {
              return 'heavy' // Heavy components
            }
            if (id.includes('src/components/Login.vue') ||
              id.includes('src/components/logins/')) {
              return 'login-page'
            }
          },
        },
      },
      modulePreload: {
        polyfill: false,
        resolveDependencies: (filename, deps) => {
          return deps.filter((dep) => !/(monaco|heavy|vendor|vuetify)/.test(dep))
        },
      },
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
