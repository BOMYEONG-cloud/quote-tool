"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EstimateFormProps = {
  sessionExists: boolean;
  loading: boolean;
  editingId: string | null;
  quoteNumber: string;
  customerName: string;
  projectName: string;
  siteName: string;
  constructionType: string;
  validityDays: string;
  issuedDate: string;
  internalMemo: string;
  subtotalCustomer: string;
  vatAmount: string;
  vatIncluded: boolean;
  totalAmount: string;
  status: string;
  onQuoteNumberChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onProjectNameChange: (value: string) => void;
  onSiteNameChange: (value: string) => void;
  onConstructionTypeChange: (value: string) => void;
  onValidityDaysChange: (value: string) => void;
  onIssuedDateChange: (value: string) => void;
  onInternalMemoChange: (value: string) => void;
  onSubtotalCustomerChange: (value: string) => void;
  onVatAmountChange: (value: string) => void;
  onVatIncludedChange: (value: boolean) => void;
  onTotalAmountChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onOpenPriceItemSelector: () => void;
  onInsert: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onCancelEdit: () => void;
  onRefresh: () => Promise<void>;
};

export function EstimateForm({
  sessionExists,
  loading,
  editingId,
  quoteNumber,
  customerName,
  projectName,
  siteName,
  constructionType,
  validityDays,
  issuedDate,
  internalMemo,
  subtotalCustomer,
  vatAmount,
  vatIncluded,
  totalAmount,
  status,
  onQuoteNumberChange,
  onCustomerNameChange,
  onProjectNameChange,
  onSiteNameChange,
  onConstructionTypeChange,
  onValidityDaysChange,
  onIssuedDateChange,
  onInternalMemoChange,
  onSubtotalCustomerChange,
  onVatAmountChange,
  onVatIncludedChange,
  onTotalAmountChange,
  onStatusChange,
  onOpenPriceItemSelector,
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
        <Label htmlFor="quoteNumber">견적번호 (선택)</Label>
        <Input
          id="quoteNumber"
          value={quoteNumber}
          onChange={(e) => onQuoteNumberChange(e.target.value)}
          placeholder="비워두면 자동 생성 (예: Q-2026-0001)"
          disabled={!sessionExists}
        />
      </div>

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
        <Label htmlFor="siteName">세부 현장명 (선택)</Label>
        <Input
          id="siteName"
          value={siteName}
          onChange={(e) => onSiteNameChange(e.target.value)}
          placeholder="예: A동 2층"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="constructionType">시공 종류 (선택)</Label>
        <Input
          id="constructionType"
          value={constructionType}
          onChange={(e) => onConstructionTypeChange(e.target.value)}
          placeholder="예: 외장 패널 시공"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtotalCustomer">공급가 (고객 기준)</Label>
        <Input
          id="subtotalCustomer"
          type="number"
          value={subtotalCustomer}
          onChange={(e) => onSubtotalCustomerChange(e.target.value)}
          placeholder="예: 1000000"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vatAmount">부가세</Label>
        <Input
          id="vatAmount"
          type="number"
          value={vatAmount}
          onChange={(e) => onVatAmountChange(e.target.value)}
          placeholder="예: 100000"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalAmount">총액</Label>
        <Input
          id="totalAmount"
          type="number"
          value={totalAmount}
          onChange={(e) => onTotalAmountChange(e.target.value)}
          placeholder="예: 1100000"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="validityDays">유효일수</Label>
        <Input
          id="validityDays"
          type="number"
          value={validityDays}
          onChange={(e) => onValidityDaysChange(e.target.value)}
          placeholder="30"
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuedDate">발행일</Label>
        <Input
          id="issuedDate"
          type="date"
          value={issuedDate}
          onChange={(e) => onIssuedDateChange(e.target.value)}
          disabled={!sessionExists}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">상태</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={!sessionExists}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="임시저장">임시저장</option>
          <option value="발송됨">발송됨</option>
          <option value="보류">보류</option>
          <option value="수락됨">수락됨</option>
          <option value="거절됨">거절됨</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vatIncluded" className="flex items-center gap-2">
          <input
            id="vatIncluded"
            type="checkbox"
            checked={vatIncluded}
            onChange={(e) => onVatIncludedChange(e.target.checked)}
            disabled={!sessionExists}
          />
          부가세 포함
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalMemo">내부 메모 (선택)</Label>
        <textarea
          id="internalMemo"
          value={internalMemo}
          onChange={(e) => onInternalMemoChange(e.target.value)}
          placeholder="내부 참고 내용을 입력하세요."
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
            {loading ? "저장 중..." : "견적 저장"}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={onOpenPriceItemSelector}
          disabled={loading}
        >
          단가표에서 선택
        </Button>

        <Button variant="outline" onClick={onRefresh} disabled={loading || !sessionExists}>
          목록 새로고침
        </Button>
      </div>
    </div>
  );
}
