import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      all: true,
      exclude: ['**/*.d.ts', '**/*.test.ts', 'test/**/*', 'dist/**/*', 'coverage/**', '**/*.mjs'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    disableConsoleIntercept: true,
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 15_000,
  },
})
