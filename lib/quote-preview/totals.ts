import type { QuoteItem } from "@/components/estimate/types";

export type QuoteComputedTotals = {
  subtotal: number;
  vat: number;
  total: number;
};

/**
 * 견적 편집 화면과 동일: 품목 소계 합으로 공급가·부가세·총액을 산출.
 */
export function computeQuoteTotals(
  items: Array<Pick<QuoteItem, "subtotal_customer">>,
  vatIncluded: boolean
): QuoteComputedTotals {
  const itemsSum = items.reduce((acc, item) => acc + (Number(item.subtotal_customer) || 0), 0);

  if (vatIncluded) {
    const total = itemsSum;
    const subtotal = Number((itemsSum / 1.1).toFixed(2));
    const vat = Number((total - subtotal).toFixed(2));
    return { subtotal, vat, total };
  }

  const subtotal = itemsSum;
  const vat = Number((subtotal * 0.1).toFixed(2));
  const total = Number((subtotal + vat).toFixed(2));
  return { subtotal, vat, total };
}
