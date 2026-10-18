import { defineConfig } from 'vitest/config';

// Rules tests need the emulators, so they're separate from `pnpm test`.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'], environment: 'node', testTimeout: 15_000, fileParallelism: false },
});
