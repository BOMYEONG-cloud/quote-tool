"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UNIT_OPTIONS = ["m²", "평", "식", "개", "m"] as const;

type PriceItemFormProps = {
  sessionExists: boolean;
  loading: boolean;
  editingId: string | null;
  category: string;
  categorySuggestions: string[];
  internalName: string;
  customerName: string;
  unit: string;
  costPrice: string;
  marginRate: string;
  customerPrice: string;
  memo: string;
  onCategoryChange: (value: string) => void;
  onInternalNameChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onCostPriceChange: (value: string) => void;
  onMarginRateChange: (value: string) => void;
  onCustomerPriceChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  onInsert: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onCancelEdit: () => void;
  onRefresh: () => Promise<void>;
};

export function PriceItemForm({
  sessionExists,
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
  onMarginRateChange,
  onCustomerPriceChange,
  onMemoChange,
  onInsert,
  onUpdate,
  onCancelEdit,
  onRefresh,
}: PriceItemFormProps) {
  return (
    <div className="w-full max-w-3xl space-y-4 rounded-lg border p-4">
      {!sessionExists && (
        <p className="text-sm text-red-500">단가표 기능은 로그인 후 사용할 수 있습니다.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          list="price-item-category-options"
          placeholder="예: 간판"
          disabled={!sessionExists}
        />
        <datalist id="price-item-category-options">
          {categorySuggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalName">내부용 이름</Label>
        <Input
          id="internalName"
          value={internalName}
          onChange={(e) => onInternalNameChange(e.target.value)}
          placeholder="예: 난이도 높은 외벽 보수"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerName">고객용 이름</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder="예: 외벽 보수 시공"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">단위</Label>
        <select
          id="unit"
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          disabled={!sessionExists}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {UNIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="costPrice">원가 (선택)</Label>
        <Input
          id="costPrice"
          type="number"
          value={costPrice}
          onChange={(e) => onCostPriceChange(e.target.value)}
          placeholder="비워두면 NULL"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="marginRate">마진율 % (선택)</Label>
        <Input
          id="marginRate"
          type="number"
          value={marginRate}
          onChange={(e) => onMarginRateChange(e.target.value)}
          placeholder="비워두면 NULL"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerPrice">고객가</Label>
        <Input
          id="customerPrice"
          type="number"
          value={customerPrice}
          onChange={(e) => onCustomerPriceChange(e.target.value)}
          placeholder="예: 120000"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">메모 (선택)</Label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="세부 조건이나 참고 사항"
          disabled={!sessionExists}
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        {editingId ? (
          <>
            <Button onClick={onUpdate} disabled={loading || !sessionExists}>
              {loading ? "저장 중..." : "수정 저장"}
            </Button>
            <Button variant="outline" disabled={loading} onClick={onCancelEdit}>
              취소
            </Button>
          </>
        ) : (
          <Button onClick={onInsert} disabled={loading || !sessionExists}>
            {loading ? "저장 중..." : "단가 항목 저장"}
          </Button>
        )}

        <Button variant="outline" onClick={onRefresh} disabled={loading || !sessionExists}>
          목록 새로고침
        </Button>
      </div>
    </div>
  );
}

