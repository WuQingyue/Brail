import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/utils/setup.js'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,vue}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,vue}',
        '**/*.spec.{js,vue}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
