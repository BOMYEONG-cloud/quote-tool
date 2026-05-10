import type { CompanyRow } from "@/lib/company";
import type { Estimate, QuoteItem } from "@/components/estimate/types";
import { computeQuoteTotals } from "@/lib/quote-preview/totals";
import { adjustedCustomerSubtotal, sumQuoteQuantities } from "@/lib/quote-margin";

/** 표·단가 숫자용 (원 접미사 없음) */
export function formatKRWAmount(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

const money = (n: number) => `${formatKRWAmount(n)}원`;

export function displayCompanyLabel(company: CompanyRow | null | undefined): string {
  const t = company?.business_name?.trim();
  return t && t.length > 0 ? t : "[회사명 미입력]";
}

export function formatIssuedDate(issuedDate: string): string {
  const s = issuedDate?.trim() ?? "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {
    /* ignore */
  }
  return s.slice(0, 10);
}

/** 미리보기·PDF·항목별 텍스트 상단 제목: 「현장명 견적서」 */
export function itemizedDocumentTitle(estimate: Estimate): string {
  const site = estimate.project_name?.trim();
  return site && site.length > 0 ? `${site} 견적서` : "견적서";
}

/** 발행일(로컬 자정) + 유효일수 → 마감일 YYYY-MM-DD */
export function computeValidityEndDate(issuedDate: string, validityDays: number): string {
  const issued = formatIssuedDate(issuedDate);
  const [y, m, d] = issued.split("-").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return issued;
  }
  const base = new Date(y, m - 1, d);
  const days = Number.isFinite(validityDays) ? Math.max(0, Math.floor(validityDays)) : 30;
  base.setDate(base.getDate() + days);
  const yy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatValidityLine(estimate: Estimate): string {
  const end = computeValidityEndDate(estimate.issued_date, estimate.validity_days ?? 30);
  return `${end}까지`;
}

export type PreviewFormatInput = {
  estimate: Estimate;
  items: QuoteItem[];
  company: CompanyRow | null;
};

/** 일괄 마진 반영 후 공급가·부가세·총액 */
export function computeAdjustedQuoteTotals(estimate: Estimate, items: QuoteItem[]) {
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const totalQty = sumQuoteQuantities(ordered);
  const mf = Number(estimate.margin_flat_amount ?? 0);
  const adjustedRows = ordered.map((r) => ({
    subtotal_customer: adjustedCustomerSubtotal(r, mf, totalQty),
  }));
  return computeQuoteTotals(adjustedRows, estimate.vat_included);
}

export type CompanyDisplayLines = {
  repBiz: string | null;
  address: string | null;
  phoneEmail: string | null;
};

/** 미리보기·PDF·텍스트에서 공통으로 쓰는 회사 3줄 포맷 */
export function buildCompanyDisplayLines(company: CompanyRow | null): CompanyDisplayLines {
  if (!company) return { repBiz: null, address: null, phoneEmail: null };

  const rep = company.representative_name?.trim();
  const bn = company.business_number?.trim();
  const addr = company.address?.trim();
  const ph = company.phone?.trim();
  const em = company.email?.trim();

  const repBiz =
    rep || bn
      ? `${rep ? `대표 ${rep}` : ""}${rep && bn ? " / " : ""}${bn ?? ""}`.trim()
      : null;
  const address = addr || null;
  const phoneEmail =
    ph || em ? `${ph ?? ""}${ph && em ? " / " : ""}${em ?? ""}`.trim() : null;

  return { repBiz, address, phoneEmail };
}

function companyDetailLines(company: CompanyRow | null): string[] {
  if (!company) return [];
  const { repBiz, address, phoneEmail } = buildCompanyDisplayLines(company);
  const lines: string[] = [];
  if (repBiz) lines.push(repBiz);
  if (address) lines.push(address);
  if (phoneEmail) lines.push(phoneEmail);
  return lines;
}

export function buildItemizedPlainText(input: PreviewFormatInput): string {
  const { estimate, items, company } = input;
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const totalQty = sumQuoteQuantities(ordered);
  const mf = Number(estimate.margin_flat_amount ?? 0);
  const totals = computeAdjustedQuoteTotals(estimate, items);
  const co = displayCompanyLabel(company);
  const issued = formatIssuedDate(estimate.issued_date);
  const qn = estimate.quote_number?.trim() ?? "";

  const lines: string[] = [];
  if (qn) {
    lines.push(`견적번호: ${qn}`);
    lines.push(`발행일: ${issued}`);
    lines.push("");
  }
  lines.push(itemizedDocumentTitle(estimate));
  lines.push("");
  lines.push(co);
  for (const L of companyDetailLines(company)) {
    lines.push(L);
  }
  lines.push("─────────────────");
  lines.push("");
  lines.push(`고객명: ${estimate.customer_name?.trim() || "—"}`);
  lines.push(`현장명: ${estimate.project_name?.trim() || "—"}`);
  const siteDetail = estimate.site_name?.trim();
  if (siteDetail) lines.push(`세부 현장명: ${siteDetail}`);
  const ctype = estimate.construction_type?.trim();
  if (ctype) lines.push(`시공 종류: ${ctype}`);
  lines.push(`유효기간: ${formatValidityLine(estimate)}`);
  lines.push("");
  lines.push("품목 표:");
  lines.push("| 품목명 | 단위 | 단가 | 수량 | 소계 |");

  for (const row of ordered) {
    const name = row.customer_name?.trim() || "—";
    const unit = row.unit?.trim() || "—";
    const qty = Number(row.quantity ?? 0);
    const unitPrice = Number(row.unit_customer_price ?? 0);
    const sub = adjustedCustomerSubtotal(row, mf, totalQty);
    lines.push(
      `| ${name} | ${unit} | ${money(unitPrice)} | ${qty} | ${money(sub)} |`
    );
  }

  lines.push("");
  lines.push(`공급가: ${money(totals.subtotal)}`);
  lines.push(`부가세: ${money(totals.vat)}`);
  lines.push("─────────────────");
  lines.push(`총액: ${money(totals.total)}`);
  lines.push("");
  const pubNotes = estimate.customer_notes?.trim();
  if (pubNotes) {
    lines.push("비고");
    lines.push(pubNotes);
    lines.push("");
  }
  lines.push("상기와 같이 견적합니다.");
  lines.push(`${co} 드림`);
  lines.push("─────────────────");

  return lines.join("\n");
}

export function buildKakaoPlainText(input: PreviewFormatInput): string {
  const { estimate, items, company } = input;
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const totalQty = sumQuoteQuantities(ordered);
  const mf = Number(estimate.margin_flat_amount ?? 0);
  const totals = computeAdjustedQuoteTotals(estimate, items);
  const co = displayCompanyLabel(company);
  const issued = formatIssuedDate(estimate.issued_date);
  const qn = estimate.quote_number?.trim() || "—";
  const project = estimate.project_name?.trim() || "현장";
  const companyLines = buildCompanyDisplayLines(company);

  const lines: string[] = [];
  lines.push(`[${project} 견적서]`);
  lines.push("");
  lines.push(`📍 현장: ${estimate.project_name?.trim() || "—"}`);
  lines.push(`👤 고객: ${estimate.customer_name?.trim() || "—"}`);
  lines.push("");
  lines.push("📋 항목:");

  for (const row of ordered) {
    const name = row.customer_name?.trim() || "—";
    const qty = Number(row.quantity ?? 0);
    const u = row.unit?.trim() || "";
    const sub = adjustedCustomerSubtotal(row, mf, totalQty);
    lines.push(`- ${name} (${qty}${u}): ${money(sub)}`);
  }

  lines.push("");

  if (estimate.vat_included) {
    lines.push(`💰 총액: ${money(totals.total)} (부가세 포함)`);
  } else {
    lines.push(
      `💰 공급가: ${money(totals.subtotal)} / 부가세: ${money(totals.vat)} / 총액: ${money(totals.total)}`
    );
  }

  lines.push("");
  lines.push(`📅 발행일: ${issued}`);
  lines.push(`견적번호: ${qn}`);
  lines.push("");
  lines.push(`${co} 드림`);
  const pubNotes = estimate.customer_notes?.trim();
  if (pubNotes) {
    lines.push("");
    lines.push(`📝 비고`);
    lines.push(pubNotes);
  }
  if (companyLines.repBiz) lines.push(companyLines.repBiz);
  if (companyLines.address) lines.push(companyLines.address);
  if (companyLines.phoneEmail) lines.push(companyLines.phoneEmail);

  return lines.join("\n");
}

export function sanitizeFilenamePart(raw: string): string {
  return raw
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}
