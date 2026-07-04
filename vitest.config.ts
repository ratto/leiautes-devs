/**
 * Configuração do Vitest — testes unitários das camadas Model (Core) e
 * ViewModel (stores/composables), que são TypeScript puro e rodam em Node.
 * Fluxos de UI são cobertos pelo Playwright (E2E), conforme o PRD.
 */

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/vitest/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // A meta de ≥85% vale para as camadas testáveis por unidade (PRD/HLD):
      // o Core de leiautes e a ViewModel. A View é coberta por E2E.
      include: ['src/core/**/*.ts', 'src/stores/**/*.ts', 'src/composables/**/*.ts'],
      exclude: ['src/stores/index.ts'],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 80,
      },
    },
  },
});
