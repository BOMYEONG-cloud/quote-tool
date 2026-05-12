"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MANUAL_CATEGORY_CUSTOM } from "@/lib/editable-quote-category";
import { adjustedCustomerSubtotal, sumQuoteQuantities } from "@/lib/quote-margin";

export type EditableQuoteItem = {
  client_id: string;
  is_manual: boolean;
  category: string;
  custom_category: string;
  price_item_id: string | null;
  internal_name: string;
  customer_name: string;
  unit: string;
  quantity: number;
  unit_cost_price: number | null;
  margin_rate: number | null;
  unit_customer_price: number;
  subtotal_cost: number | null;
  subtotal_customer: number;
  sort_order: number;
  save_to_price_items: boolean;
};

const PRESET_UNITS = ["m²", "평", "식", "개", "m"] as const;
const UNIT_OTHER = "__custom__";

type QuoteItemListProps = {
  items: EditableQuoteItem[];
  categoryOptions: string[];
  /** 일괄 마진 원화; 행 소계 표시 시 수량 비례 분배 반영 */
  marginFlatAmount?: number;
  loading: boolean;
  onItemChange: (clientId: string, patch: Partial<EditableQuoteItem>) => void;
  onRemove: (clientId: string) => void;
  onMove: (clientId: string, direction: "up" | "down") => void;
  embedded?: boolean;
};

function UnitSelectRow({
  unit,
  loading,
  onChange,
}: {
  unit: string;
  loading: boolean;
  onChange: (next: string) => void;
}) {
  const presetList = PRESET_UNITS as unknown as string[];
  const isPreset = presetList.includes(unit);
  const [customMode, setCustomMode] = useState(() => unit !== "" && !isPreset);

  const selectVal = customMode ? UNIT_OTHER : unit === "" ? "" : isPreset ? unit : "";

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <select
        aria-label="단위"
        value={selectVal}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            setCustomMode(false);
            onChange("");
            return;
          }
          if (v === UNIT_OTHER) {
            setCustomMode(true);
            if (isPreset) onChange("");
            return;
          }
          setCustomMode(false);
          onChange(v);
        }}
        className="h-12 min-h-12 min-w-[6.5rem] flex-1 rounded-md border border-input bg-background px-3 text-base sm:max-w-[10rem]"
        disabled={loading}
      >
        <option value="">단위</option>
        {PRESET_UNITS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={UNIT_OTHER}>직접 입력</option>
      </select>
      {customMode ? (
        <Input
          className="min-w-[6rem] flex-1"
          placeholder="단위 직접 입력 (예: 대, 롤)"
          value={unit}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        />
      ) : null}
    </div>
  );
}

export function QuoteItemList({
  items,
  categoryOptions,
  marginFlatAmount = 0,
  loading,
  onItemChange,
  onRemove,
  onMove,
  embedded = false,
}: QuoteItemListProps) {
  const ordered = items.slice().sort((a, b) => a.sort_order - b.sort_order);
  const totalQty = useMemo(() => sumQuoteQuantities(ordered), [ordered]);

  const mergedCategoryOptions = useMemo(() => {
    const set = new Set(categoryOptions);
    for (const row of ordered) {
      if (row.is_manual && row.category.trim()) set.add(row.category.trim());
    }
    const sorted = [...set].sort((a, b) => a.localeCompare(b, "ko-KR"));
    return [
      ...sorted.filter((option) => option !== MANUAL_CATEGORY_CUSTOM),
      ...sorted.filter((option) => option === MANUAL_CATEGORY_CUSTOM),
    ];
  }, [categoryOptions, ordered]);

  const marginLabel = (margin: number | null) =>
    margin == null || !Number.isFinite(margin) ? "—" : `${margin}%`;

  return (
    <section
        className={
        embedded
          ? "w-full space-y-3"
          : "w-full max-w-2xl space-y-3 rounded-lg border p-4"
      }
      aria-label={embedded ? undefined : "선택된 견적 항목"}
    >
      {!embedded && <h2 className="text-lg font-semibold tracking-tight">선택된 견적 항목</h2>}
      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground sm:text-base">단가표에서 항목을 선택해 추가하세요.</p>
      ) : (
        <ul className="space-y-2.5">
          {ordered.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === ordered.length - 1;

            return (
              <li key={item.client_id} className="rounded-lg border p-3 sm:p-3.5">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="위로 이동"
                      disabled={loading || isFirst}
                      onClick={() => onMove(item.client_id, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="아래로 이동"
                      disabled={loading || isLast}
                      onClick={() => onMove(item.client_id, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="min-w-0 flex-1">
                    {item.is_manual ? (
                      <div className="space-y-2.5">
                        <p className="text-base font-semibold text-gray-900">단가 입력</p>

                        <div className="grid gap-2 md:grid-cols-2 md:items-start md:gap-2.5">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                              고객용 이름 <span className="text-red-500">*</span>
                            </p>
                            <Input
                              placeholder="고객용 이름 (필수)"
                              value={item.customer_name}
                              onChange={(e) =>
                                onItemChange(item.client_id, { customer_name: e.target.value })
                              }
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                              고객가 <span className="text-red-500">*</span>
                            </p>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="고객용 단가 (원, 필수)"
                              value={item.unit_customer_price > 0 ? String(item.unit_customer_price) : ""}
                              onChange={(e) =>
                                onItemChange(item.client_id, {
                                  unit_customer_price: Number(e.target.value || 0),
                                })
                              }
                              disabled={loading}
                              className="tabular-nums"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <p className="text-sm font-medium text-gray-700">
                              카테고리 <span className="text-red-500">*</span>
                            </p>
                            <select
                              aria-label="카테고리"
                              value={
                                mergedCategoryOptions.includes(item.category) ? item.category : ""
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                onItemChange(item.client_id, {
                                  category: v,
                                  custom_category: v === MANUAL_CATEGORY_CUSTOM ? item.custom_category : "",
                                });
                              }}
                              className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                              disabled={loading}
                            >
                              <option value="">카테고리</option>
                              {mergedCategoryOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option === MANUAL_CATEGORY_CUSTOM ? "직접 입력" : option}
                                </option>
                              ))}
                            </select>
                          </div>
                          {item.category === MANUAL_CATEGORY_CUSTOM ? (
                            <div className="md:col-span-2">
                              <Input
                                placeholder="카테고리명 직접 입력"
                                value={item.custom_category}
                                onChange={(e) =>
                                  onItemChange(item.client_id, { custom_category: e.target.value })
                                }
                                disabled={loading}
                              />
                            </div>
                          ) : null}
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">원가</p>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="원가 (원)"
                              value={item.unit_cost_price == null ? "" : String(item.unit_cost_price)}
                              onChange={(e) =>
                                onItemChange(item.client_id, {
                                  unit_cost_price: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                              disabled={loading}
                              className="tabular-nums"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">마진율</p>
                            <div
                              className="flex h-12 min-h-12 items-center rounded-md border border-input bg-gray-50 px-3 text-sm tabular-nums text-gray-900 sm:text-base"
                              title={
                                item.unit_cost_price != null &&
                                item.unit_cost_price >= 0 &&
                                item.unit_customer_price > 0
                                  ? "고객가 기준"
                                  : undefined
                              }
                            >
                              {marginLabel(item.margin_rate)}
                              {item.unit_cost_price != null &&
                              item.unit_cost_price >= 0 &&
                              item.unit_customer_price > 0 ? (
                                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                                  (고객가 기준)
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">내부용 이름</p>
                            <Input
                              placeholder="내부용 이름"
                              value={item.internal_name}
                              onChange={(e) =>
                                onItemChange(item.client_id, { internal_name: e.target.value })
                              }
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                              단위 <span className="text-red-500">*</span>
                            </p>
                            <UnitSelectRow
                              unit={item.unit}
                              loading={loading}
                              onChange={(next) => onItemChange(item.client_id, { unit: next })}
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm leading-snug sm:text-base">
                          <input
                            type="checkbox"
                            checked={item.save_to_price_items}
                            onChange={(e) =>
                              onItemChange(item.client_id, {
                                save_to_price_items: e.target.checked,
                              })
                            }
                            disabled={loading}
                          />
                          단가표에 저장
                        </label>
                      </div>
                    ) : (
                      <>
                        <p className="text-base font-semibold text-gray-900 sm:text-lg">{item.customer_name}</p>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          내부명: {item.internal_name}
                        </p>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          단가: {Number(item.unit_customer_price || 0).toLocaleString()}원 /{" "}
                          {item.unit}
                          {item.margin_rate != null && Number.isFinite(item.margin_rate) ? (
                            <span className="tabular-nums">
                              {" "}
                              · 마진 {item.margin_rate}%
                            </span>
                          ) : null}
                        </p>
                      </>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(item.quantity)}
                        onChange={(e) =>
                          onItemChange(item.client_id, {
                            quantity: Number(e.target.value || 0),
                          })
                        }
                        disabled={loading}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground sm:text-base">
                        수량 <span className="text-red-500">*</span>
                      </span>
                      <span className="ml-auto text-sm font-semibold tabular-nums text-gray-900 sm:text-base">
                        소계:{" "}
                        {Math.round(
                          adjustedCustomerSubtotal(item, marginFlatAmount, totalQty)
                        ).toLocaleString()}
                        원
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove(item.client_id)}
                        disabled={loading}
                      >
                        항목 삭제
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
