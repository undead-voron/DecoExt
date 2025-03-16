import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import webExtension from '@samrum/vite-plugin-web-extension'
import swc from 'vite-plugin-swc-transform'
import { getManifest } from './src/manifest'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      webExtension({
        manifest: getManifest(Number(env.MANIFEST_VERSION)),
        useDynamicUrlWebAccessibleResources: false,
      }),
      swc({
        swcOptions: {
          jsc: {
            target: 'es2022',
            transform: {
              legacyDecorator: true,
              decoratorMetadata: true,
              useDefineForClassFields: false,
            },
            // externalHelpers: true,
          },
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string, arg) => {
            console.log('id', id, 'arg', arg.getModuleIds())
            if (id.includes('webextension-polyfill')) {
              return 'webextension-polyfill'
            }
            if (id.includes('@offerstock')) {
              if (id.includes('background')) {
                return 'offerstock-bg'
              }
              if (id.includes('content')) {
                return 'offerstock-content'
              }
            }
            // if (id.includes(''))
          },
        },
      },
    },
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },

    },
  }
})
