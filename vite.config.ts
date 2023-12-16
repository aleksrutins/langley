import { defineConfig } from 'vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import devServer from '@hono/vite-dev-server'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [
    viteCommonjs(),
    pages(),
    devServer({
      entry: 'src/index.tsx',
      cf: {
        kvNamespaces: ['LANGLEY_CACHE']
      }
    })
  ]
})
