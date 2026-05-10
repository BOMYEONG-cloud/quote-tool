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
import { Label } from "@/components/ui/label";

const UNIT_OPTIONS = ["m²", "평", "식", "개", "m"] as const;
const CATEGORY_CUSTOM = "__custom__" as const;

type PriceItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  editingId: string | null;
  category: string;
  categorySuggestions: string[];
  internalName: string;
  customerName: string;
  unit: string;
  costPrice: string;
  marginRate: number | null;
  customerPrice: string;
  memo: string;
  onCategoryChange: (value: string) => void;
  onInternalNameChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onCostPriceChange: (value: string) => void;
  onCustomerPriceChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function PriceItemDialog({
  open,
  onOpenChange,
  loading,
  editingId,
  category,
  categorySuggestions,
  internalName,
  customerName,
  unit,
  costPrice,
  marginRate,
  customerPrice,
  memo,
  onCategoryChange,
  onInternalNameChange,
  onCustomerNameChange,
  onUnitChange,
  onCostPriceChange,
  onCustomerPriceChange,
  onMemoChange,
  onSubmit,
}: PriceItemDialogProps) {
  const isEdit = Boolean(editingId);

  const presetCategories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const name of categorySuggestions) {
      const value = name?.trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      ordered.push(value);
    }
    ordered.sort((a, b) => a.localeCompare(b, "ko-KR"));
    return ordered;
  }, [categorySuggestions]);

  const trimmedCategory = category.trim();
  const isPresetCategory = trimmedCategory.length > 0 && presetCategories.includes(trimmedCategory);
  const [customMode, setCustomMode] = useState(
    () => trimmedCategory.length > 0 && !isPresetCategory
  );

  const selectValue = customMode
    ? CATEGORY_CUSTOM
    : isPresetCategory
      ? trimmedCategory
      : "";

  const handleCategorySelect = (value: string) => {
    if (value === CATEGORY_CUSTOM) {
      setCustomMode(true);
      onCategoryChange("");
      return;
    }
    setCustomMode(false);
    onCategoryChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0"
      >
        <div className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>{isEdit ? "단가 수정" : "새 단가 추가"}</DialogTitle>
          <DialogDescription className="mt-1">
            카테고리·내부용/고객용 이름·단위·가격·메모를 입력하세요.
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="space-y-2">
            <Label htmlFor="dlg-category">카테고리</Label>
            <select
              id="dlg-category"
              value={selectValue}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
            >
              <option value="" disabled>
                카테고리를 선택하세요
              </option>
              {presetCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CATEGORY_CUSTOM}>+ 직접 입력</option>
            </select>
            {customMode ? (
              <Input
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                placeholder="새 카테고리 입력 (예: 간판)"
              />
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dlg-customerName">고객용 이름</Label>
              <Input
                id="dlg-customerName"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="예: 외벽 보수 시공"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlg-internalName">내부용 이름</Label>
              <Input
                id="dlg-internalName"
                value={internalName}
                onChange={(e) => onInternalNameChange(e.target.value)}
                placeholder="예: 난이도 높은 외벽 보수"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dlg-customerPrice">고객가</Label>
              <Input
                id="dlg-customerPrice"
                type="number"
                value={customerPrice}
                onChange={(e) => onCustomerPriceChange(e.target.value)}
                placeholder="예: 120000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlg-costPrice">원가</Label>
              <Input
                id="dlg-costPrice"
                type="number"
                value={costPrice}
                onChange={(e) => onCostPriceChange(e.target.value)}
                placeholder="비워두면 기록 없음"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dlg-unit">단위</Label>
              <select
                id="dlg-unit"
                value={unit}
                onChange={(e) => onUnitChange(e.target.value)}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>마진율</Label>
              <div className="flex h-12 items-center rounded-md border border-input bg-gray-50 px-3 text-sm tabular-nums">
                {marginRate == null ? "—" : `${marginRate}%`}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dlg-memo">메모 (선택)</Label>
            <textarea
              id="dlg-memo"
              value={memo}
              onChange={(e) => onMemoChange(e.target.value)}
              placeholder="세부 조건이나 참고 사항"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 text-gray-700"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button onClick={() => void onSubmit()} disabled={loading}>
            {loading ? "저장 중..." : isEdit ? "수정 저장" : "단가 저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
