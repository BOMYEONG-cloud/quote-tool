"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceItem } from "@/components/price-item/types";

type PriceItemSelectorProps = {
  open: boolean;
  loading: boolean;
  items: PriceItem[];
  onClose: () => void;
  onConfirm: (selected: PriceItem[]) => void;
};

export function PriceItemSelector({
  open,
  loading,
  items,
  onClose,
  onConfirm,
}: PriceItemSelectorProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));
    return ["전체", ...unique.sort((a, b) => a.localeCompare(b, "ko-KR"))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => item.is_active)
      .filter((item) => (categoryFilter === "전체" ? true : item.category === categoryFilter))
      .filter((item) => {
        if (!q) return true;
        return (
          item.internal_name.toLowerCase().includes(q) ||
          item.customer_name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.usage_count - a.usage_count);
  }, [items, query, categoryFilter]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, PriceItem[]>>((acc, item) => {
      const key = item.category || "미분류";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const groupKeys = useMemo(
    () => Object.keys(grouped).sort((a, b) => a.localeCompare(b, "ko-KR")),
    [grouped]
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    const selected = items.filter((item) => selectedIds.includes(item.id));
    onConfirm(selected);
    setSelectedIds([]);
    setQuery("");
    setCategoryFilter("전체");
  };

  const handleClose = () => {
    onClose();
    setSelectedIds([]);
    setQuery("");
    setCategoryFilter("전체");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-background p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">단가표에서 선택</h2>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            닫기
          </Button>
        </div>

        <div className="mb-4 grid gap-2 md:grid-cols-2">
          <Input
            placeholder="내부용 이름 / 고객용 이름 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-md border p-3">
          {groupKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">조건에 맞는 단가 항목이 없습니다.</p>
          ) : (
            groupKeys.map((category) => (
              <div key={category} className="space-y-2">
                <h3 className="font-medium">{category}</h3>
                <ul className="space-y-2">
                  {grouped[category].map((item) => (
                    <li key={item.id} className="rounded border p-2">
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggle(item.id)}
                          disabled={loading}
                        />
                        <div className="text-sm">
                          <p className="font-medium">{item.customer_name}</p>
                          <p className="text-muted-foreground">내부명: {item.internal_name}</p>
                          <p>
                            고객가: {Number(item.customer_price || 0).toLocaleString()}원 / {item.unit}
                          </p>
                          <p className="text-muted-foreground">사용횟수: {item.usage_count ?? 0}</p>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={loading || selectedIds.length === 0}>
            선택한 {selectedIds.length}개 추가
          </Button>
        </div>
      </div>
    </div>
  );
}

