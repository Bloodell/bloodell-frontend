import { defineConfig, devices } from '@playwright/test'

/**
 * E2E no navegador real. Por padrao a API e simulada nos proprios testes
 * (tests/e2e/api-simulada.ts): mocks valem para teste, nunca para o app.
 * O servidor e o "next dev" (o rewrite de /api so existe nele).
 */
const PORTA = Number(process.env.E2E_PORTA ?? 5173)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Recife',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://127.0.0.1:${PORTA}/login`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
