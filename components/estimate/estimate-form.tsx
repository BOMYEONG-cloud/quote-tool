"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EstimateFormProps = {
  sessionExists: boolean;
  loading: boolean;
  editingId: string | null;
  customerName: string;
  projectName: string;
  amount: string;
  onCustomerNameChange: (value: string) => void;
  onProjectNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onInsert: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onCancelEdit: () => void;
  onRefresh: () => Promise<void>;
};

export function EstimateForm({
  sessionExists,
  loading,
  editingId,
  customerName,
  projectName,
  amount,
  onCustomerNameChange,
  onProjectNameChange,
  onAmountChange,
  onInsert,
  onUpdate,
  onCancelEdit,
  onRefresh,
}: EstimateFormProps) {
  return (
    <div className="w-full max-w-2xl space-y-4 rounded-lg border p-4">
      {!sessionExists && (
        <p className="text-sm text-red-500">견적 기능은 로그인 후 사용할 수 있습니다.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="customerName">고객명</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder="예: 홍길동"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectName">현장명</Label>
        <Input
          id="projectName"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="예: 강남 외장 시공"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">금액</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="예: 1500000"
          disabled={!sessionExists}
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
            {loading ? "저장 중..." : "견적 저장"}
          </Button>
        )}

        <Button variant="outline" onClick={onRefresh} disabled={loading || !sessionExists}>
          목록 새로고침
        </Button>
      </div>
    </div>
  );
}
