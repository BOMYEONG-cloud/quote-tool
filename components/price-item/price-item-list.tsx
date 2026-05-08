"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <h2 className="mb-3 text-xl font-semibold">단가표 목록</h2>

      {!sessionExists ? (
        <p className="text-sm text-muted-foreground">로그인 후 단가표를 확인할 수 있습니다.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">활성 단가 항목이 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-lg font-medium">{category}</h3>
              <ul className="space-y-2">
                {grouped[category].map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{item.customer_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>내부명: {item.internal_name}</p>
                      <p>
                        고객가: {Number(item.customer_price || 0).toLocaleString()}원 / {item.unit}
                      </p>
                      <p>원가: {item.cost_price == null ? "-" : Number(item.cost_price).toLocaleString()}</p>
                      <p>마진율: {item.margin_rate == null ? "-" : `${item.margin_rate}%`}</p>
                      <p>사용횟수: {item.usage_count ?? 0}</p>
                      <p>메모: {item.memo?.trim() ? item.memo : "-"}</p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => onStartEdit(item)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          onClick={() => onSoftDelete(item.id)}
                        >
                          비활성화
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

