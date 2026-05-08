"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PriceItem } from "@/components/price-item/types";

type PriceItemListProps = {
  sessionExists: boolean;
  loading: boolean;
  items: PriceItem[];
  onStartEdit: (item: PriceItem) => void;
  onSoftDelete: (id: string) => Promise<void>;
};

export function PriceItemList({
  sessionExists,
  loading,
  items,
  onStartEdit,
  onSoftDelete,
}: PriceItemListProps) {
  const grouped = items.reduce<Record<string, PriceItem[]>>((acc, item) => {
    const key = item.category || "미분류";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "ko-KR"));

  return (
    <section className="w-full max-w-3xl">
      {!sessionExists ? (
        <p className="text-sm text-muted-foreground">로그인 후 단가표를 확인할 수 있습니다.</p>
      ) : items.length === 0 ? null : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-lg font-medium">{category}</h3>
              <ul className="space-y-2">
                {grouped[category].map((item) => {
                  const subInfoParts = [item.internal_name, item.unit].filter(
                    (value): value is string => Boolean(value && String(value).trim())
                  );

                  const hasCost = item.cost_price != null;
                  const hasMargin = item.margin_rate != null;
                  const hasUsage = (item.usage_count ?? 0) > 0;
                  const hasMemo = Boolean(item.memo?.trim());
                  const hasDetailRow = hasCost || hasMargin || hasUsage || hasMemo;

                  return (
                    <li key={item.id}>
                      <Card>
                        <CardContent className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 text-base font-semibold text-gray-900">
                              {item.customer_name}
                            </p>
                            <p className="shrink-0 text-right text-base font-semibold text-gray-900">
                              {Number(item.customer_price || 0).toLocaleString()}원
                              <span className="font-normal text-gray-600"> / {item.unit}</span>
                            </p>
                          </div>

                          {subInfoParts.length > 0 ? (
                            <p className="text-sm text-gray-500">{subInfoParts.join(" · ")}</p>
                          ) : null}

                          {hasDetailRow ? (
                            <>
                              <Separator />
                              <div className="space-y-1 text-sm text-gray-600">
                                {hasCost ? (
                                  <p>원가 {Number(item.cost_price).toLocaleString()}원</p>
                                ) : null}
                                {hasMargin ? <p>마진율 {item.margin_rate}%</p> : null}
                                {hasUsage ? <p>사용횟수 {item.usage_count}</p> : null}
                                {hasMemo ? (
                                  <p className="text-muted-foreground">메모: {item.memo}</p>
                                ) : null}
                              </div>
                            </>
                          ) : null}

                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loading}
                              onClick={() => onStartEdit(item)}
                            >
                              수정
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              disabled={loading}
                              onClick={() => onSoftDelete(item.id)}
                            >
                              비활성화
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
