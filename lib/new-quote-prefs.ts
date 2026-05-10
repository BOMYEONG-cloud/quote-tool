/** 새 견적 작성 시 유효일수 입력값 기억 (로컬) */
export const NEW_QUOTE_VALIDITY_DAYS_LS_KEY = "quote-tool:last-new-quote-validity-days";

export function readLastNewQuoteValidityDays(): number | null {
  try {
    const raw = window.localStorage.getItem(NEW_QUOTE_VALIDITY_DAYS_LS_KEY);
    if (raw === null) return null;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

export function writeLastNewQuoteValidityDays(days: number): void {
  if (!Number.isFinite(days) || days <= 0) return;
  try {
    window.localStorage.setItem(NEW_QUOTE_VALIDITY_DAYS_LS_KEY, String(days));
  } catch {
    /* ignore quota */
  }
}
