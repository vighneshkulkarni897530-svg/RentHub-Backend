import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
include: ['tests/**/*.test.{ts,js}'],
    testTimeout: 30000,
    pool: 'threads',
    fileParallelism: false,
  },
});
