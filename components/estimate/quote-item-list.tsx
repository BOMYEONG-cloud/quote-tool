"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

type QuoteItemListProps = {
  items: EditableQuoteItem[];
  loading: boolean;
  onItemChange: (clientId: string, patch: Partial<EditableQuoteItem>) => void;
  onRemove: (clientId: string) => void;
  onMove: (clientId: string, direction: "up" | "down") => void;
  /** 외부 카드 안에 넣을 때 테두리·중복 제목 제거 */
  embedded?: boolean;
};

const CATEGORY_OPTIONS = ["간판", "창호", "필름", "도배", "외벽", "기타", "직접입력"] as const;
const UNIT_OPTIONS = ["m²", "평", "식", "개", "m"] as const;

export function QuoteItemList({
  items,
  loading,
  onItemChange,
  onRemove,
  onMove,
  embedded = false,
}: QuoteItemListProps) {
  const ordered = items.slice().sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section
      className={
        embedded
          ? "w-full space-y-3"
          : "w-full max-w-2xl space-y-3 rounded-lg border p-4"
      }
      aria-label={embedded ? undefined : "선택된 견적 항목"}
    >
      {!embedded && <h2 className="text-lg font-semibold">선택된 견적 항목</h2>}
      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">단가표에서 항목을 선택해 추가하세요.</p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === ordered.length - 1;

            return (
              <li key={item.client_id} className="rounded border p-3">
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">직접 입력 항목</p>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            직접 입력
                          </span>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              onItemChange(item.client_id, { category: e.target.value })
                            }
                            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                            disabled={loading}
                          >
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <Input
                            placeholder="고객용 이름 (필수)"
                            value={item.customer_name}
                            onChange={(e) =>
                              onItemChange(item.client_id, { customer_name: e.target.value })
                            }
                            disabled={loading}
                          />
                        </div>

                        {item.category === "직접입력" && (
                          <Input
                            placeholder="카테고리 직접 입력"
                            value={item.custom_category}
                            onChange={(e) =>
                              onItemChange(item.client_id, { custom_category: e.target.value })
                            }
                            disabled={loading}
                          />
                        )}

                        <div className="grid gap-2 md:grid-cols-2">
                          <Input
                            placeholder="내부용 이름 (옵션)"
                            value={item.internal_name}
                            onChange={(e) =>
                              onItemChange(item.client_id, { internal_name: e.target.value })
                            }
                            disabled={loading}
                          />
                          <select
                            value={item.unit}
                            onChange={(e) =>
                              onItemChange(item.client_id, { unit: e.target.value })
                            }
                            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                            disabled={loading}
                          >
                            {UNIT_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-2 md:grid-cols-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="원가 (옵션)"
                            value={
                              item.unit_cost_price == null ? "" : String(item.unit_cost_price)
                            }
                            onChange={(e) =>
                              onItemChange(item.client_id, {
                                unit_cost_price: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            disabled={loading}
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="마진율 % (옵션)"
                            value={item.margin_rate == null ? "" : String(item.margin_rate)}
                            onChange={(e) =>
                              onItemChange(item.client_id, {
                                margin_rate: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            disabled={loading}
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="고객가 (옵션)"
                            value={String(item.unit_customer_price)}
                            onChange={(e) =>
                              onItemChange(item.client_id, {
                                unit_customer_price: Number(e.target.value || 0),
                              })
                            }
                            disabled={loading}
                          />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
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
                          단가표에도 저장
                        </label>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{item.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          내부명: {item.internal_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          단가: {Number(item.unit_customer_price || 0).toLocaleString()}원 /{" "}
                          {item.unit}
                        </p>
                      </>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
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
                      <span className="text-sm text-muted-foreground">수량</span>
                      <span className="ml-auto text-sm font-medium">
                        소계: {Number(item.subtotal_customer || 0).toLocaleString()}원
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
