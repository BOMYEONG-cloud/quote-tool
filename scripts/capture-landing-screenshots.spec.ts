import * as fs from "node:fs";
import * as path from "node:path";
import { test, expect, devices, type Page } from "@playwright/test";

function loadEnvLocal() {
  try {
    const p = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(p)) return;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();

const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo.landing@quotesnote.kr";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "";

function landingDir() {
  return path.join(process.cwd(), "public", "landing");
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function assertReachable() {
  const url = `${BASE}/login`;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    void res.status;
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "cause" in err
        ? (err as { cause?: { code?: string } }).cause?.code
        : undefined;
    if (code === "ECONNREFUSED") {
      throw new Error(
        `연결 실패: ${url}\n→ npm run dev 를 켠 뒤 다시 실행하거나 BASE_URL 을 지정하세요.`
      );
    }
    throw err;
  }
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(DEMO_EMAIL);
  await page.locator("#password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  const successUrl = /\/(quotes|onboarding|settings\/company)(\/|$)/;
  const failLine = page.getByText(/로그인 실패/);

  await Promise.race([
    page.waitForURL(successUrl, { timeout: 45_000 }),
    failLine.first().waitFor({ state: "visible", timeout: 45_000 }),
  ]).catch(() => null);

  if (page.url().includes("/login")) {
    const hint = await page.locator("p.text-red-600").first().textContent().catch(() => "");
    throw new Error(
      hint?.trim()
        ? `로그인 실패: ${hint.trim()}`
        : "로그인 실패. DEMO_EMAIL·DEMO_PASSWORD·BASE_URL 을 확인하세요."
    );
  }

  if (page.url().includes("/onboarding")) {
    throw new Error("온보딩 미완료입니다. 데모 시드 또는 온보딩 완료 후 다시 실행하세요.");
  }
  if (page.url().includes("/settings/company")) {
    throw new Error("회사 정보가 없습니다. companies 시드 또는 회사 설정 후 다시 실행하세요.");
  }
}

async function firstPreviewHref(page: Page): Promise<string> {
  await page.goto(`${BASE}/quotes`, { waitUntil: "domcontentloaded" });
  const link = page.locator('a[href^="/quotes/"][href$="/preview"]').first();
  await expect(link).toBeVisible({ timeout: 30_000 });
  const href = await link.getAttribute("href");
  if (!href) throw new Error("첫 견적 preview 링크를 찾지 못했습니다.");
  return href;
}

function quoteIdFromPreviewHref(href: string): string {
  const m = href.match(/^\/quotes\/([^/]+)\/preview$/);
  if (!m?.[1]) throw new Error(`preview href 파싱 실패: ${href}`);
  return m[1];
}

/** 견적 편집 2단계(항목·합계·총액 영역)로 이동 */
async function goToQuoteEditorStep2(page: Page, quoteId: string) {
  await page.goto(`${BASE}/quotes/${quoteId}`, { waitUntil: "domcontentloaded" });
  await sleep(700);

  for (let i = 0; i < 3; i++) {
    const totalsVisible = await page
      .getByText("총액", { exact: true })
      .first()
      .isVisible()
      .catch(() => false);
    if (totalsVisible) return;

    const next = page.getByRole("button", { name: "다음", exact: true });
    if (await next.isEnabled().catch(() => false)) {
      await next.click();
      await sleep(600);
    } else {
      break;
    }
  }
}

/** fullPage 스크린샷은 스크롤 조각을 이어 붙이므로 position:fixed 하단 바가
 *  각 조각마다 뷰포트에 붙어 중간·중복처럼 보일 수 있음 → 캡처 직전에 문서 흐름으로 전환 */
async function unfixBottomDocksForFullPageScreenshot(page: Page) {
  await page.addStyleTag({
    content: `
      [data-capture-dock] {
        position: static !important;
        inset: auto !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    `,
  });
}

test("랜딩용 스크린샷 (데스크톱 + 모바일)", async ({ browser }) => {
  if (!DEMO_PASSWORD) {
    throw new Error("DEMO_PASSWORD 환경 변수를 설정하세요. (.env.local 또는 셸)");
  }

  await assertReachable();
  fs.mkdirSync(landingDir(), { recursive: true });

  const out = (name: string) => path.join(landingDir(), name);

  // ----- 데스크톱 -----
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktopCtx.newPage();

  await login(page);
  const previewHref = await firstPreviewHref(page);
  const quoteId = quoteIdFromPreviewHref(previewHref);

  await goToQuoteEditorStep2(page, quoteId);
  await page.screenshot({ path: out("01-quote-editor.png"), fullPage: true });

  await page.goto(`${BASE}/quotes`, { waitUntil: "networkidle" }).catch(() =>
    page.goto(`${BASE}/quotes`, { waitUntil: "domcontentloaded" })
  );
  await sleep(500);
  await unfixBottomDocksForFullPageScreenshot(page);
  await page.screenshot({ path: out("02-quote-list.png"), fullPage: true });

  await page.goto(`${BASE}/price-items`, { waitUntil: "domcontentloaded" });
  await sleep(500);
  await unfixBottomDocksForFullPageScreenshot(page);
  await page.screenshot({ path: out("03-price-items.png"), fullPage: true });

  await page.goto(`${BASE}${previewHref}`, { waitUntil: "domcontentloaded" });
  await sleep(800);
  await page.screenshot({ path: out("04-quote-preview.png"), fullPage: true });

  await desktopCtx.close();

  // ----- 모바일 (iPhone 14 Pro) -----
  const phone = devices["iPhone 14 Pro"] ?? devices["iPhone 14"];
  const mobileCtx = await browser.newContext(phone);
  const mPage = await mobileCtx.newPage();
  await login(mPage);
  await mPage.goto(`${BASE}/quotes`, { waitUntil: "domcontentloaded" });
  await sleep(600);
  await unfixBottomDocksForFullPageScreenshot(mPage);
  await mPage.screenshot({ path: out("05-mobile.png"), fullPage: true });
  await mobileCtx.close();

  process.stdout.write(`저장 완료: ${landingDir()}\n`);
});
