import { defineConfig } from "@playwright/test";

/**
 * 랜딩용 스크린샷: `npm run capture-landing`
 * BASE_URL, DEMO_EMAIL, DEMO_PASSWORD 는 셸 또는 .env.local(수동 로드는 스펙 파일 참고)
 */
export default defineConfig({
  testDir: "./scripts",
  testMatch: "**/capture-landing-screenshots*.ts",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ignoreHTTPSErrors: true,
  },
});
