"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <p className="text-sm text-muted-foreground sm:text-base">
          로그인 후 단가표를 확인할 수 있습니다.
        </p>
      ) : items.length === 0 ? null : (
        <div className="space-y-5">
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="border-l-2 border-indigo-400 pl-3 text-base font-semibold tracking-tight text-gray-900 sm:text-lg">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {grouped[category].map((item) => {
                  const hasCost = item.cost_price != null;
                  const hasMargin = item.margin_rate != null;
                  const hasUsage = (item.usage_count ?? 0) > 0;
                  const hasMemo = Boolean(item.memo?.trim());
                  const internal = item.internal_name?.trim();
                  const unitRaw = item.unit?.trim();
                  const unitDisplay = unitRaw && unitRaw.length > 0 ? unitRaw : "—";

                  return (
                    <li key={item.id}>
                      <Card size="sm" className="shadow-sm">
                        <CardContent className="space-y-2 py-3">
                          <div className="flex gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-base font-semibold leading-snug text-gray-900 sm:text-lg">
                                {item.customer_name}
                              </p>
                              {internal ? (
                                <p className="text-sm leading-snug text-muted-foreground sm:text-base">
                                  {internal}
                                </p>
                              ) : null}
                            </div>
                            <div className="min-w-0 shrink-0 space-y-1 text-right">
                              <p className="text-base font-semibold tabular-nums text-gray-900 sm:text-lg">
                                {Number(item.customer_price || 0).toLocaleString()}원
                                <span className="font-medium text-gray-500">
                                  /{unitDisplay}
                                </span>
                              </p>
                              {hasCost ? (
                                <p className="text-sm tabular-nums text-muted-foreground sm:text-base">
                                  원가 {Number(item.cost_price).toLocaleString()}원
                                </p>
                              ) : null}
                              {hasMargin ? (
                                <p className="text-sm tabular-nums text-muted-foreground sm:text-base">
                                  마진율 {item.margin_rate}%
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {hasUsage || hasMemo ? (
                            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                              {hasUsage ? <>사용 {item.usage_count}회</> : null}
                              {hasUsage && hasMemo ? " · " : null}
                              {hasMemo ? <>메모: {item.memo}</> : null}
                            </p>
                          ) : null}

                          <div className="flex justify-end gap-2 pt-0.5">
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
