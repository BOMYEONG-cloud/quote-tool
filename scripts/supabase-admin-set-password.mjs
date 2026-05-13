/**
 * 이메일 수신이 불가능한 계정도, Supabase Admin API로 비밀번호를 직접 바꿉니다.
 * (Dashboard의 "비밀번호 재설정 메일" 없이 사용)
 *
 * 필요: Project Settings → API 의 service_role 키 (절대 커밋·공개 금지)
 *
 * PowerShell 예:
 *   # .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 있다면 자동 로드
 *   $env:TARGET_EMAIL="demo.landing@quotesnote.kr"
 *   $env:NEW_PASSWORD="원하는비밀번호"
 *   npm run demo:set-password
 *
 * 또는 URL/키를 직접:
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.env.TARGET_EMAIL ?? process.env.DEMO_EMAIL;
const newPassword = process.env.NEW_PASSWORD;

if (!url || !serviceRole) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL(또는 SUPABASE_URL) 와 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.\n" +
      "Supabase Dashboard → Project Settings → API 에서 확인하세요."
  );
  process.exit(1);
}

if (!targetEmail || !newPassword) {
  console.error("TARGET_EMAIL(또는 DEMO_EMAIL), NEW_PASSWORD 환경 변수를 설정하세요.");
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error("사용자 목록 조회 실패:", listError.message);
  process.exit(1);
}

const user = listData.users.find(
  (u) => u.email?.toLowerCase() === targetEmail.trim().toLowerCase()
);

if (!user) {
  console.error(`이메일이 일치하는 사용자가 없습니다: ${targetEmail}`);
  process.exit(1);
}

const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
  password: newPassword,
  email_confirm: true,
});

if (error) {
  console.error("비밀번호 변경 실패:", error.message);
  process.exit(1);
}

console.log("완료:", data.user?.email, "id=", data.user?.id);
console.log("앱에서 위 NEW_PASSWORD 로 로그인하면 됩니다.");
