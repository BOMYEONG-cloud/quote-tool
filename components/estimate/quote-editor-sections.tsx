"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditableQuoteItem, QuoteItemList } from "@/components/estimate/quote-item-list";
import { cn } from "@/lib/utils";

export type StepState = "completed" | "current" | "pending";

export type Step = {
  number: number;
  label: string;
  state: StepState;
};

type QuoteStepsProps = {
  steps: Step[];
};

export function QuoteSteps({ steps }: QuoteStepsProps) {
  return (
    <ol className="flex w-full items-center gap-2" aria-label="견적 작성 진행 단계">
      {steps.map((step, index) => (
        <Fragment key={step.number}>
          <li className="flex items-center gap-2" aria-current={step.state === "current" ? "step" : undefined}>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                step.state === "completed" && "border-indigo-600 bg-indigo-600 text-white",
                step.state === "current" && "border-indigo-600 bg-white text-indigo-600",
                step.state === "pending" && "border-gray-300 bg-white text-gray-400"
              )}
              aria-hidden="true"
            >
              {step.state === "completed" ? <Check className="h-4 w-4" /> : step.number}
            </span>
            <span
              className={cn(
                "whitespace-nowrap",
                step.state === "completed" && "text-base font-semibold text-gray-900",
                step.state === "current" && "text-base font-semibold text-indigo-700",
                step.state === "pending" && "text-sm font-normal text-gray-500"
              )}
            >
              {step.label}
            </span>
          </li>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-px flex-1 self-center",
                step.state === "completed" ? "bg-indigo-600" : "bg-gray-200"
              )}
              aria-hidden="true"
            />
          )}
        </Fragment>
      ))}
    </ol>
  );
}

type SiteInfoSectionProps = {
  sessionExists: boolean;
  quoteNumber: string;
  customerName: string;
  projectName: string;
  siteName: string;
  constructionType: string;
  validityDays: string;
  issuedDate: string;
  status: string;
  onQuoteNumberChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onProjectNameChange: (value: string) => void;
  onSiteNameChange: (value: string) => void;
  onConstructionTypeChange: (value: string) => void;
  onValidityDaysChange: (value: string) => void;
  onIssuedDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function SiteInfoSection({
  sessionExists,
  quoteNumber,
  customerName,
  projectName,
  siteName,
  constructionType,
  validityDays,
  issuedDate,
  status,
  onQuoteNumberChange,
  onCustomerNameChange,
  onProjectNameChange,
  onSiteNameChange,
  onConstructionTypeChange,
  onValidityDaysChange,
  onIssuedDateChange,
  onStatusChange,
}: SiteInfoSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-section-site">
      <h3 id="quote-section-site" className="text-base font-semibold text-gray-900">
        현장 정보
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
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
            <Label htmlFor="status">상태</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={!sessionExists}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
            >
              <option value="임시저장">임시저장</option>
              <option value="발송됨">발송됨</option>
              <option value="보류">보류</option>
              <option value="수락됨">수락됨</option>
              <option value="거절됨">거절됨</option>
            </select>
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
            <Label htmlFor="quoteNumber">견적번호 (선택)</Label>
            <Input
              id="quoteNumber"
              value={quoteNumber}
              onChange={(e) => onQuoteNumberChange(e.target.value)}
              placeholder="자동 생성됨"
              disabled={!sessionExists}
            />
          </div>
        </div>
    </section>
  );
}

type ItemsSectionProps = {
  sessionExists: boolean;
  loading: boolean;
  items: EditableQuoteItem[];
  onOpenSelector: () => void;
  onAddManual: () => void;
  onItemChange: (clientId: string, patch: Partial<EditableQuoteItem>) => void;
  onRemove: (clientId: string) => void;
  onMove: (clientId: string, direction: "up" | "down") => void;
  embedded?: boolean;
};

export function ItemsSection({
  sessionExists,
  loading,
  items,
  onOpenSelector,
  onAddManual,
  onItemChange,
  onRemove,
  onMove,
  embedded = false,
}: ItemsSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-section-items">
      <h3 id="quote-section-items" className="text-base font-semibold text-gray-900">
        견적 항목
      </h3>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !sessionExists}
          onClick={onOpenSelector}
        >
          단가표에서 선택
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !sessionExists}
          onClick={onAddManual}
        >
          직접 입력
        </Button>
      </div>

      <QuoteItemList
        items={items}
        loading={loading}
        onItemChange={onItemChange}
        onRemove={onRemove}
        onMove={onMove}
        embedded={embedded}
      />
    </section>
  );
}

type TotalsSectionProps = {
  sessionExists: boolean;
  subtotalCustomer: string;
  vatAmount: string;
  vatIncluded: boolean;
  totalAmount: string;
  onVatIncludedChange: (value: boolean) => void;
};

const formatKRW = (value: string) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};

export function TotalsSection({
  sessionExists,
  subtotalCustomer,
  vatAmount,
  vatIncluded,
  totalAmount,
  onVatIncludedChange,
}: TotalsSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-section-totals">
      <h3 id="quote-section-totals" className="text-base font-semibold text-gray-900">
        합계
      </h3>
      <Label htmlFor="vatIncluded" className="flex items-center gap-2 text-sm">
        <input
          id="vatIncluded"
          type="checkbox"
          checked={vatIncluded}
          onChange={(e) => onVatIncludedChange(e.target.checked)}
          disabled={!sessionExists}
        />
        부가세 포함 견적
      </Label>

      <div className="space-y-2 rounded-md bg-white p-4 ring-1 ring-indigo-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">공급가</span>
          <span className="font-medium text-gray-900">{formatKRW(subtotalCustomer)}원</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">부가세</span>
          <span className="font-medium text-gray-900">{formatKRW(vatAmount)}원</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between border-t border-indigo-100 pt-3">
          <span className="text-sm font-medium text-gray-900">총액</span>
          <span className="text-2xl font-bold text-primary">{formatKRW(totalAmount)}원</span>
        </div>
      </div>
    </section>
  );
}

type MemoSectionProps = {
  sessionExists: boolean;
  internalMemo: string;
  onInternalMemoChange: (value: string) => void;
};

export function MemoSection({
  sessionExists,
  internalMemo,
  onInternalMemoChange,
}: MemoSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-section-memo">
      <h3 id="quote-section-memo" className="text-base font-semibold text-gray-900">
        메모
      </h3>
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
    </section>
  );
}

type SaveActionsProps = {
  sessionExists: boolean;
  loading: boolean;
  editingId: string | null;
  onInsert: () => void | Promise<void>;
  onUpdate: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onCancel: () => void;
};

export function SaveActions({
  sessionExists,
  loading,
  editingId,
  onInsert,
  onUpdate,
  onDelete,
  onCancel,
}: SaveActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {editingId ? (
          <>
            <Button onClick={onUpdate} disabled={loading || !sessionExists}>
              {loading ? "저장 중..." : "수정 저장"}
            </Button>
            {onDelete ? (
              <Button
                variant="destructive"
                disabled={loading || !sessionExists}
                onClick={() => void onDelete()}
              >
                삭제
              </Button>
            ) : null}
          </>
        ) : (
          <Button onClick={onInsert} disabled={loading || !sessionExists}>
            {loading ? "저장 중..." : "견적 저장"}
          </Button>
        )}
      </div>
      <Button
        variant="outline"
        className="border-gray-300 text-gray-700 sm:ml-auto"
        disabled={loading}
        onClick={onCancel}
      >
        취소
      </Button>
    </div>
  );
}
