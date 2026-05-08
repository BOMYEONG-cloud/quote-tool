"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const resetState = () => {
    setSelectedIds([]);
    setQuery("");
    setCategoryFilter("전체");
  };

  const handleConfirm = () => {
    const selected = items.filter((item) => selectedIds.includes(item.id));
    onConfirm(selected);
    resetState();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0"
      >
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <DialogTitle>단가표에서 선택</DialogTitle>
            <DialogDescription className="mt-1">
              체크박스로 여러 항목을 선택해 한 번에 추가할 수 있어요.
            </DialogDescription>
          </div>
          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            선택 {selectedIds.length}개
          </span>
        </div>

        <div className="shrink-0 border-b border-border bg-gray-50/60 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">검색</p>
              <Input
                placeholder="내부명 또는 고객용 이름으로 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">카테고리</p>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                disabled={loading}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {groupKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">조건에 맞는 단가 항목이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {groupKeys.map((category) => (
                <div key={category} className="space-y-2">
                  <div className="rounded bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-900">
                    {category}
                  </div>
                  <ul className="space-y-2">
                    {grouped[category].map((item) => {
                      const selected = selectedIds.includes(item.id);
                      return (
                        <li key={item.id}>
                          <label
                            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                              selected
                                ? "border-indigo-300 bg-indigo-50/60"
                                : "border-border bg-background hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggle(item.id)}
                              disabled={loading}
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1 text-sm">
                              <p className="text-base font-medium text-gray-900">
                                {item.customer_name}
                              </p>
                              <p className="text-gray-500">{item.internal_name}</p>
                              <p className="text-gray-700">
                                고객가:{" "}
                                {Number(item.customer_price || 0).toLocaleString()}원 / {item.unit}
                              </p>
                              {(item.usage_count ?? 0) > 0 ? (
                                <p className="text-gray-500">
                                  사용횟수 {item.usage_count}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={loading || selectedIds.length === 0}>
            선택한 {selectedIds.length}개 추가하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
