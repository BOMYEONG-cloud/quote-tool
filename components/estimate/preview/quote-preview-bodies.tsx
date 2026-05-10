import type { Estimate, QuoteItem } from "@/components/estimate/types";
import {
  displayCompanyLabel,
  formatIssuedDate,
  formatValidityLine,
  itemizedDocumentTitle,
} from "@/lib/quote-preview/format-plain";
import { computeQuoteTotals } from "@/lib/quote-preview/totals";

const money = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export type PreviewBodiesProps = {
  estimate: Estimate;
  items: QuoteItem[];
  companyName: string | null;
};

/** 미리보기 본문: 구분선·표·텍스트 블록 좌우 정렬 동일 (카드 패딩 안쪽 전폭) */
export function ItemizedPreviewBody({ estimate, items, companyName }: PreviewBodiesProps) {
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const totals = computeQuoteTotals(ordered, estimate.vat_included);
  const co = displayCompanyLabel(companyName);
  const issued = formatIssuedDate(estimate.issued_date);
  const qn = estimate.quote_number?.trim() || "";
  const siteDetail = estimate.site_name?.trim();
  const ctype = estimate.construction_type?.trim();

  const cellBorder = "border border-gray-300";

  return (
    <div className="flex w-full max-w-full flex-col gap-6 text-gray-900">
      <div className="flex w-full items-start gap-2">
        <div className="min-w-0 flex-1 shrink-0" aria-hidden />
        <div className="min-w-0 flex-[2] space-y-3 text-center">
          <p className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {itemizedDocumentTitle(estimate)}
          </p>
          <p className="text-base font-medium">{co}</p>
        </div>
        <div className="flex min-w-0 flex-1 shrink-0 justify-end pt-0.5">
          {qn ? (
            <span className="max-w-full text-right text-xs font-normal text-gray-500 tabular-nums">
              {qn}
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-px w-full bg-gray-300" aria-hidden />

      <dl className="w-full space-y-2 text-left text-sm">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-gray-600">고객명</dt>
          <dd className="min-w-0">{estimate.customer_name?.trim() || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-gray-600">현장명</dt>
          <dd className="min-w-0">{estimate.project_name?.trim() || "—"}</dd>
        </div>
        {siteDetail ? (
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-600">세부 현장명</dt>
            <dd className="min-w-0">{siteDetail}</dd>
          </div>
        ) : null}
        {ctype ? (
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-gray-600">시공 종류</dt>
            <dd className="min-w-0">{ctype}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-gray-600">발행일</dt>
          <dd className="tabular-nums">{issued}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-gray-600">유효기간</dt>
          <dd className="tabular-nums">{formatValidityLine(estimate)}</dd>
        </div>
      </dl>

      {/* 전폭 표: 둥근 wrapper 제거 → 꼭지 잘림 방지, 구분선과 동일 여백 */}
      <div className="mx-auto w-full max-w-full overflow-visible">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "19%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "25%" }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th
                className={`${cellBorder} px-1.5 py-2 text-left text-xs font-medium sm:px-2 sm:text-sm`}
              >
                품목명
              </th>
              <th
                className={`${cellBorder} px-1 py-2 text-center text-xs font-medium sm:px-2 sm:text-sm`}
              >
                단위
              </th>
              <th
                className={`${cellBorder} px-1 py-2 text-right text-xs font-medium tabular-nums sm:px-2 sm:text-sm`}
              >
                단가
              </th>
              <th
                className={`${cellBorder} px-1 py-2 text-center text-xs font-medium tabular-nums sm:px-2 sm:text-sm`}
              >
                수량
              </th>
              <th
                className={`${cellBorder} px-1 py-2 text-right text-xs font-medium tabular-nums sm:px-2 sm:text-sm`}
              >
                소계
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => (
              <tr key={row.id}>
                <td className={`${cellBorder} min-w-0 px-1.5 py-2 break-words sm:px-2`}>
                  {row.customer_name?.trim() || "—"}
                </td>
                <td className={`${cellBorder} px-1 py-2 text-center align-top sm:px-2`}>
                  {row.unit?.trim() || "—"}
                </td>
                <td className={`${cellBorder} px-1 py-2 text-right align-top tabular-nums sm:px-2`}>
                  {money(Number(row.unit_customer_price ?? 0))}
                </td>
                <td className={`${cellBorder} px-1 py-2 text-center align-top tabular-nums sm:px-2`}>
                  {Number(row.quantity ?? 0)}
                </td>
                <td className={`${cellBorder} px-1 py-2 text-right align-top tabular-nums sm:px-2`}>
                  {money(Number(row.subtotal_customer ?? 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="w-full border-t border-gray-300 pt-4">
        <div className="space-y-1 text-right text-sm tabular-nums">
          <p>공급가: {money(totals.subtotal)}</p>
          <p>부가세: {money(totals.vat)}</p>
          <p className="pt-2 text-base font-semibold">총액: {money(totals.total)}</p>
        </div>
      </div>

      <div className="w-full border-t border-gray-200 pt-6 text-center text-sm">
        <p>상기와 같이 견적합니다.</p>
        <p className="mt-3 font-medium">{co} 드림</p>
        <div className="mt-8 h-px w-full bg-gray-300" aria-hidden />
      </div>
    </div>
  );
}
