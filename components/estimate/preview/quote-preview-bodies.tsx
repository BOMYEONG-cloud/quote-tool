import type { CompanyRow } from "@/lib/company";
import type { Estimate, QuoteItem } from "@/components/estimate/types";
import {
  buildCompanyDisplayLines,
  displayCompanyLabel,
  formatIssuedDate,
  formatKRWAmount,
  formatValidityLine,
  itemizedDocumentTitle,
} from "@/lib/quote-preview/format-plain";
import { computeAdjustedQuoteTotals } from "@/lib/quote-preview/format-plain";
import { adjustedCustomerSubtotal, sumQuoteQuantities } from "@/lib/quote-margin";

const money = (n: number) => `${formatKRWAmount(n)}원`;

export type PreviewBodiesProps = {
  estimate: Estimate;
  items: QuoteItem[];
  company: CompanyRow | null;
  /** Storage private 버킷용 signed URL — 미리보기·PNG 캡처에만 사용 */
  logoSignedUrl?: string | null;
  stampSignedUrl?: string | null;
};

const metaBorder = "border border-gray-300";

/** 미리보기: 최상단 견적번호·발행일 표 → 제목·구분선 → 우측 회사 정보 */
export function ItemizedPreviewBody({
  estimate,
  items,
  company,
  logoSignedUrl = null,
  stampSignedUrl = null,
}: PreviewBodiesProps) {
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const totalQty = sumQuoteQuantities(ordered);
  const marginFlat = Number(estimate.margin_flat_amount ?? 0);
  const totals = computeAdjustedQuoteTotals(estimate, items);
  const notes = estimate.customer_notes?.trim();
  const co = displayCompanyLabel(company);
  const issued = formatIssuedDate(estimate.issued_date);
  const qn = estimate.quote_number?.trim() || "";
  const siteDetail = estimate.site_name?.trim();
  const ctype = estimate.construction_type?.trim();

  const companyLines = buildCompanyDisplayLines(company);

  const cellBorder = "border border-gray-300";

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 text-gray-900">
      <div className="flex w-full min-w-0 justify-end">
        <table className="border-collapse text-left text-xs text-gray-800 sm:text-sm">
          <tbody>
            <tr>
              <th
                className={`${metaBorder} whitespace-nowrap bg-gray-50 px-2 py-1.5 text-center font-medium text-gray-700`}
              >
                견적번호
              </th>
              <td className={`${metaBorder} min-w-[7rem] max-w-[240px] px-2 py-1.5 tabular-nums`}>
                {qn || "—"}
              </td>
            </tr>
            <tr>
              <th
                className={`${metaBorder} whitespace-nowrap bg-gray-50 px-2 py-1.5 text-center font-medium text-gray-700`}
              >
                발행일
              </th>
              <td className={`${metaBorder} px-2 py-1.5 tabular-nums`}>{issued}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-center">
        <p className="text-2xl font-bold tracking-tight break-keep text-gray-900 sm:text-3xl">
          {itemizedDocumentTitle(estimate)}
        </p>
      </div>

      <div className="h-px w-full bg-gray-300" aria-hidden />

      <div className="flex w-full min-w-0 justify-end">
        <div className="flex max-w-full min-w-0 items-start gap-1.5 sm:gap-2">
          <div className="min-w-0 max-w-full text-right text-xs text-gray-800 sm:text-sm">
            <p className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{co}</p>
            <div className="mt-2 space-y-0.5 text-xs text-gray-700 sm:text-sm">
              {companyLines.repBiz ? <p className="break-words">{companyLines.repBiz}</p> : null}
              {companyLines.address ? <p className="break-words">{companyLines.address}</p> : null}
              {companyLines.phoneEmail ? (
                <p className="break-words">{companyLines.phoneEmail}</p>
              ) : null}
            </div>
          </div>
          {logoSignedUrl ? (
            <div className="flex shrink-0 flex-col items-end justify-start pl-1 sm:pl-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSignedUrl}
                alt=""
                className="h-16 max-h-20 w-auto max-w-[140px] object-contain object-right sm:h-20"
              />
            </div>
          ) : null}
        </div>
      </div>

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
          <dt className="w-28 shrink-0 text-gray-600">유효기간</dt>
          <dd className="tabular-nums">{formatValidityLine(estimate)}</dd>
        </div>
      </dl>

      <div className="mx-auto w-full min-w-0 max-w-full">
        <table className="w-full max-w-full table-fixed border-collapse text-[10px] leading-snug sm:text-sm sm:leading-normal">
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
                className={`${cellBorder} min-w-0 px-1 py-1.5 text-center text-[10px] font-medium leading-tight sm:px-2 sm:text-sm`}
              >
                품목명
              </th>
              <th
                className={`${cellBorder} min-w-0 px-1 py-1.5 text-center text-[10px] font-medium leading-tight sm:px-2 sm:text-sm`}
              >
                단위
              </th>
              <th
                className={`${cellBorder} min-w-0 px-0.5 py-1.5 text-center text-[10px] font-medium tabular-nums leading-tight sm:px-2 sm:text-sm`}
              >
                단가(원)
              </th>
              <th
                className={`${cellBorder} min-w-0 px-1 py-1.5 text-center text-[10px] font-medium tabular-nums leading-tight sm:px-2 sm:text-sm`}
              >
                수량
              </th>
              <th
                className={`${cellBorder} min-w-0 px-0.5 py-1.5 text-center text-[10px] font-medium tabular-nums leading-tight sm:px-2 sm:text-sm`}
              >
                소계(원)
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => (
              <tr key={row.id}>
                <td
                  className={`${cellBorder} min-w-0 px-1.5 py-2 text-left max-sm:whitespace-nowrap sm:break-words sm:whitespace-normal sm:px-2`}
                >
                  {row.customer_name?.trim() || "—"}
                </td>
                <td
                  className={`${cellBorder} min-w-0 px-1 py-2 text-center align-top break-words sm:px-2`}
                >
                  {row.unit?.trim() || "—"}
                </td>
                <td
                  className={`${cellBorder} min-w-0 px-0.5 py-2 text-right align-top break-all tabular-nums sm:px-2`}
                >
                  {formatKRWAmount(Number(row.unit_customer_price ?? 0))}
                </td>
                <td
                  className={`${cellBorder} min-w-0 px-1 py-2 text-center align-top tabular-nums sm:px-2`}
                >
                  {Number(row.quantity ?? 0)}
                </td>
                <td
                  className={`${cellBorder} min-w-0 px-0.5 py-2 text-right align-top break-all tabular-nums sm:px-2`}
                >
                  {formatKRWAmount(
                    adjustedCustomerSubtotal(row, marginFlat, totalQty)
                  )}
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
          <p className="pt-2 text-base font-bold text-indigo-700">총액: {money(totals.total)}</p>
        </div>
      </div>

      {notes ? (
        <div className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-900">
          <p className="font-semibold text-gray-800">비고</p>
          <p className="mt-2 whitespace-pre-wrap break-words">{notes}</p>
        </div>
      ) : null}

      <div className="w-full border-t border-gray-200 pt-6 text-sm">
        <div className="flex w-full items-end pb-6">
          <div className="min-w-0 flex-1" aria-hidden />
          <div className="shrink-0 px-2 text-center">
            <p>상기와 같이 견적합니다.</p>
            <p className="mt-3 font-medium">{co} 드림</p>
          </div>
          <div className="flex min-h-[5rem] min-w-0 flex-1 items-end justify-end">
            {stampSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stampSignedUrl} alt="" className="h-20 w-20 shrink-0 object-contain" />
            ) : null}
          </div>
        </div>
        <div className="h-px w-full bg-gray-300" aria-hidden />
      </div>
    </div>
  );
}
