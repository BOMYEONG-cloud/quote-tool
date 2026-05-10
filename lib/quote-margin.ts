/** 수량 합계(각 행 quantity 합). */
export function sumQuoteQuantities(items: Array<{ quantity: number }>): number {
  return items.reduce((acc, row) => acc + Math.max(0, Number(row.quantity) || 0), 0);
}

/**
 * 일괄 마진을 총 수량 기준 균등(수량 비례) 분배해 행별 고객 소계에 더한 값을 반환.
 * marginFlat≤0 또는 totalQty≤0이면 기존 소계 그대로.
 */
export function adjustedCustomerSubtotal(
  item: { quantity: number; subtotal_customer: number },
  marginFlat: number,
  totalQty: number
): number {
  const base = Number(item.subtotal_customer) || 0;
  const m = Math.max(0, Number(marginFlat) || 0);
  if (m <= 0 || totalQty <= 0) return base;
  const q = Math.max(0, Number(item.quantity) || 0);
  const perUnit = m / totalQty;
  return Number((base + perUnit * q).toFixed(2));
}

/** 기존 공급가(부가세 별도 기준) 대비 일괄 마진이 차지하는 비율(%) */
export function flatMarginPercentOfBase(baseSupplyTotal: number, marginFlat: number): number | null {
  const b = Number(baseSupplyTotal) || 0;
  const m = Math.max(0, Number(marginFlat) || 0);
  if (m <= 0 || b <= 0) return null;
  return Number(((m / b) * 100).toFixed(2));
}

/** 단가 기준 마진율: (고객가 - 원가) / 원가 × 100 */
export function unitMarginPercent(
  unitCustomer: number,
  unitCost: number | null | undefined
): number | null {
  const c = unitCost == null ? NaN : Number(unitCost);
  const p = Number(unitCustomer);
  if (!Number.isFinite(c) || c <= 0 || !Number.isFinite(p) || p < 0) return null;
  return Number((((p - c) / c) * 100).toFixed(2));
}
