import { defineConfig } from '@playwright/test'
import process from 'node:process'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4175', viewport: { width: 1440, height: 1000 }, channel: process.env.PLAYWRIGHT_CHANNEL || undefined, trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175', reuseExistingServer: !process.env.CI },
})
