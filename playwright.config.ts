import { defineConfig, devices } from '@playwright/test';

const SHOWCASE = /welcome.spec.ts/;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: SHOWCASE },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testIgnore: SHOWCASE },
    // The welcome screen's 3D showcase draws several lab models at once. Test browsers render 3D
    // on the CPU (no GPU), so these run after everything else, one test at a time per device.
    {
      name: 'desktop-showcase',
      use: { ...devices['Desktop Chrome'] },
      testMatch: SHOWCASE,
      dependencies: ['desktop-chromium', 'mobile-chromium'],
    },
    {
      name: 'mobile-showcase',
      use: { ...devices['Pixel 7'] },
      testMatch: SHOWCASE,
      dependencies: ['desktop-chromium', 'mobile-chromium'],
    },
  ],
  // Tests run against the production build: the artifact learners actually receive.
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // End-to-end tests never talk to a real Supabase project: blank values here take priority
    // over .env.local, so the build under test is device-only.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
});
