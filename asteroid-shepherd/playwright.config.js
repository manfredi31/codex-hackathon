import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1100, height: 780 },
    deviceScaleFactor: 1,
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm run dev",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
