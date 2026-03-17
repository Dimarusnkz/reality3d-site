import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: [
        'lib/rate-limit.ts',
        'lib/prisma.ts',
        'lib/audit.ts',
        'lib/csrf.ts',
        'lib/request.ts',
      ],
      exclude: [
        '**/*.d.ts',
        'generated/**',
        'scripts/**',
        'prisma/**',
        'node_modules/**',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
})
