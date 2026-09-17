import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // public/ 下的绝对路径资源（如 /icons.svg#id）不能在编译期被当作模块解析
      template: { transformAssetUrls: { includeAbsolute: false } },
    }),
  ],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
    },
  },
})
