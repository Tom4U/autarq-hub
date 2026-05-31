import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.mjs', '.js'],
  },
  test: {
    include: ['src/**/*.test.mts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov'],
      reportsDirectory: '../../coverage/tooling',
    },
  },
})
