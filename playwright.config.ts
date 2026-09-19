import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 180000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || "https://diff.t7iq.com",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ar-SA",
    timezoneId: "Asia/Riyadh"
  },
  projects: [{name:"chromium",use:{...devices["Desktop Chrome"]}}],
  reporter: [["line"]]
});
