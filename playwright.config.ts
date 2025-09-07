import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/e2e/**/*.spec.ts', '**/accessibility/**/*.spec.ts', '**/performance/**/*.spec.ts'],
  fullyParallel: false, // 改为串行执行，避免端口冲突
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // 使用单个worker
  reporter: [['html'], ['list']],
  timeout: 60000, // 增加超时时间到60秒
  
  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // 单个操作超时15秒
    navigationTimeout: 30000, // 导航超时30秒
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npx http-server -p 9000 -c-1',
    port: 9000,
    reuseExistingServer: !process.env.CI,
  },
});