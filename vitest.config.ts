import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Spain is UTC+1/+2: date bugs caused by UTC conversion only show up here.
    env: { TZ: 'Europe/Madrid' },
  },
});
