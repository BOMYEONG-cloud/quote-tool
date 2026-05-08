"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EditableQuoteItem = {
  client_id: string;
  price_item_id: string | null;
  internal_name: string;
  customer_name: string;
  unit: string;
  quantity: number;
  unit_cost_price: number | null;
  unit_customer_price: number;
  subtotal_cost: number | null;
  subtotal_customer: number;
  sort_order: number;
};

type QuoteItemListProps = {
  items: EditableQuoteItem[];
  loading: boolean;
  onQuantityChange: (clientId: string, quantity: number) => void;
  onRemove: (clientId: string) => void;
};

export function QuoteItemList({ items, loading, onQuantityChange, onRemove }: QuoteItemListProps) {
  return (
    <section className="w-full max-w-2xl space-y-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">선택된 견적 항목</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">단가표에서 항목을 선택해 추가하세요.</p>
      ) : (
        <ul className="space-y-2">
          {items
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <li key={item.client_id} className="rounded border p-3">
                <p className="font-medium">{item.customer_name}</p>
                <p className="text-sm text-muted-foreground">내부명: {item.internal_name}</p>
                <p className="text-sm text-muted-foreground">
                  단가: {Number(item.unit_customer_price || 0).toLocaleString()}원 / {item.unit}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(item.quantity)}
                    onChange={(e) => onQuantityChange(item.client_id, Number(e.target.value))}
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
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

