/**
 * Configuração do Playwright — testes E2E dos fluxos críticos do PRD:
 * selecionar leiaute → preencher → validar → gerar → baixar, além dos
 * componentes-assinatura (visualizador, registro-detalhe, toggle de validação).
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'test/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Sobe o dev server do Quasar automaticamente (PLAYWRIGHT=1 evita
  // abrir o navegador do desenvolvedor — ver quasar.config.ts).
  webServer: {
    command: 'npx quasar dev',
    url: 'http://localhost:9000/#/',
    env: { PLAYWRIGHT: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
